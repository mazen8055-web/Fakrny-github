import { supabase } from '@/lib/supabase';

interface Medicine {
  id: string;
  medicine_name: string;
  frequency: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

function parseFrequency(frequency: string): number[] {
  const lowerFreq = frequency.toLowerCase();

  if (lowerFreq.includes('once') || lowerFreq.includes('1 time')) {
    return [9];
  }

  if (lowerFreq.includes('twice') || lowerFreq.includes('2 time')) {
    return [9, 21];
  }

  if (lowerFreq.includes('3 time') || lowerFreq.includes('three time')) {
    return [9, 14, 21];
  }

  if (lowerFreq.includes('4 time') || lowerFreq.includes('four time')) {
    return [8, 12, 16, 20];
  }

  if (lowerFreq.includes('every 4 hour')) {
    return [0, 4, 8, 12, 16, 20];
  }

  if (lowerFreq.includes('every 6 hour')) {
    return [6, 12, 18];
  }

  if (lowerFreq.includes('every 8 hour')) {
    return [8, 16];
  }

  if (lowerFreq.includes('every 12 hour')) {
    return [9, 21];
  }

  if (lowerFreq.includes('before bed') || lowerFreq.includes('bedtime')) {
    return [21];
  }

  if (lowerFreq.includes('morning')) {
    return [8];
  }

  return [9, 14, 21];
}

export async function generateDosesForMedicine(
  userId: string,
  medicine: Medicine,
  daysToGenerate: number = 7
): Promise<void> {
  const times = parseFrequency(medicine.frequency);
  const doses = [];

  const startDate = new Date(medicine.start_date);
  const endDate = new Date(medicine.end_date);
  const generateUntil = new Date();
  generateUntil.setDate(generateUntil.getDate() + daysToGenerate);

  const finalDate = generateUntil < endDate ? generateUntil : endDate;

  let currentDate = new Date(startDate);

  if (currentDate < new Date()) {
    currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
  }

  while (currentDate <= finalDate) {
    for (const hour of times) {
      const scheduledTime = new Date(currentDate);
      scheduledTime.setHours(hour, 0, 0, 0);

      if (scheduledTime >= new Date()) {
        doses.push({
          user_id: userId,
          medicine_id: medicine.id,
          scheduled_time: scheduledTime.toISOString(),
          status: 'pending',
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (doses.length > 0) {
    const { error } = await supabase
      .from('medicine_doses')
      .insert(doses);

    if (error) {
      console.error('Error generating doses:', error);
    }
  }
}

export async function generateDosesForAllActiveMedicines(userId: string): Promise<void> {
  const { data: medicines, error } = await supabase
    .from('user_medicines')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true);

  if (error || !medicines) {
    console.error('Error fetching medicines:', error);
    return;
  }

  const { data: existingDoses } = await supabase
    .from('medicine_doses')
    .select('medicine_id')
    .eq('user_id', userId)
    .gte('scheduled_time', new Date().toISOString());

  const medicinesWithDoses = new Set(existingDoses?.map(d => d.medicine_id) || []);

  for (const medicine of medicines) {
    if (!medicinesWithDoses.has(medicine.id)) {
      await generateDosesForMedicine(userId, medicine);
    }
  }
}
