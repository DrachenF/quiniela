import { LoginForm } from '@/components/auth/auth-forms';
import { ConfigNotice } from '@/components/config-notice';
export default function Login(){return <><ConfigNotice/><section className="card mx-auto mt-4 max-w-md p-6"><h1 className="text-3xl font-black">Iniciar sesión</h1><LoginForm/></section></>}
