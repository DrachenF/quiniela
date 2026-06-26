import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/data';
export default async function Perfil(){const profile=await getProfile();if(!profile)redirect('/login');return <section className="card p-6"><h1 className="text-3xl font-black">Mi perfil</h1><div className="mt-4 grid gap-3 md:grid-cols-3"><p>Nombre: <b>{profile.first_name}</b></p><p>Perfil completo: <b>{profile.profile_completed?'Sí':'No'}</b></p><p>Estado: <b>{profile.is_active?'Activo':'Inactivo'}</b></p></div></section>}
