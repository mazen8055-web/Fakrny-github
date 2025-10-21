import { supabase } from '@/lib/supabase';

export async function seedTestDoses(userId: string, medicineId: string) {
  const now = new Date();

  const doses = [
    {
      user_id: userId,
      medicine_id: medicineId,
      scheduled_time: new Date(now.getTime() + 2 * 60 * 1000).toISOString(),
      status: 'pending',
    },
    {
      user_id: userId,
      medicine_id: medicineId,
      scheduled_time: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      status: 'pending',
    },
    {
      user_id: userId,
      medicine_id: medicineId,
      scheduled_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
    {
      user_id: userId,
      medicine_id: medicineId,
      scheduled_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
    {
      user_id: userId,
      medicine_id: medicineId,
      scheduled_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
  ];

  const { data, error } = await supabase
    .from('medicine_doses')
    .insert(doses)
    .select();

  if (error) {
    console.error('Error seeding doses:', error);
    return { success: false, error };
  }

  console.log('Successfully created test doses:', data);
  return { success: true, data };
}
