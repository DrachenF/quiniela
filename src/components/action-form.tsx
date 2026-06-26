'use client';
import { useActionState } from 'react';
export function SubmitMessage({ action, children }: { action: (state: unknown, formData: FormData) => Promise<{ok:boolean;message:string}>; children: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, null as {ok:boolean;message:string}|null);
  return <form action={formAction} className="space-y-3">{children}<button className="btn w-full disabled:opacity-50" disabled={pending}>{pending?'Guardando...':'Guardar'}</button>{state && <p className={state.ok?'text-teal-700':'text-red-700'}>{state.message}</p>}</form>;
}
