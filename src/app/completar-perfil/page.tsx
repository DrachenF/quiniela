import { redirect } from 'next/navigation';
import { SubmitMessage } from '@/components/action-form';
import { completeProfileAction } from '@/server/actions';
import { getProfile } from '@/lib/data';
export default async function Completar(){const profile=await getProfile();if(!profile)redirect('/login');return <section className="card mx-auto max-w-md p-6"><h1 className="text-3xl font-black">Completar perfil</h1><p className="text-slate-600">Necesitamos nombre y apellido para participar. El apellido no será público.</p><SubmitMessage action={completeProfileAction}><input name="first_name" className="input mt-4" placeholder="Nombre" defaultValue={profile.first_name}/><input name="last_name" className="input" placeholder="Apellido" defaultValue={profile.last_name}/></SubmitMessage></section>}
