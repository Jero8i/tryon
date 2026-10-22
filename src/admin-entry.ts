import './admin.css';
import {cloud,cloudEnabled} from './cloud';

const app=document.querySelector<HTMLElement>('#app')!;
app.innerHTML=`<main class="login-page"><section class="login-card" aria-labelledby="login-title"><p class="eyebrow">LA FILLE AUX LUNETTES · ADMINISTRACIÓN</p><h1 id="login-title">Administrar probador</h1><p>Ingresá con tu cuenta autorizada para configurar los modelos de tu tienda.</p><form id="admin-login"><label>Email<input id="email" type="email" autocomplete="username" required></label><label>Contraseña<input id="password" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Ingresar</button></form><p id="login-status" role="status" aria-live="polite"></p></section></main>`;
const form=app.querySelector<HTMLFormElement>('form')!;
const submit=form.querySelector<HTMLButtonElement>('button')!;
const notice=app.querySelector<HTMLElement>('#login-status')!;
let entering=false;
async function enter(restored=false) {
  if(entering)return;
  entering=true;submit.disabled=true;
  notice.textContent=restored?'Verificando sesión…':'Ingresando…';
  try {
    if(!restored)await cloud.login(app.querySelector<HTMLInputElement>('#email')!.value,app.querySelector<HTMLInputElement>('#password')!.value);
    await cloud.verifyEditor();
    await import('./admin');
  } catch(error) {
    await cloud.logout();
    notice.textContent=error instanceof Error?error.message:'No se pudo iniciar sesión. Volvé a intentar.';
    const password=app.querySelector<HTMLInputElement>('#password');if(password)password.value='';
  } finally {entering=false;submit.disabled=false;}
}
form.onsubmit=event=>{event.preventDefault();void enter();};
if(!cloudEnabled){notice.textContent='Falta configurar la conexión con Supabase. Consultá la configuración del proyecto.';submit.disabled=true;}
else if(cloud.signedIn())void enter(true);
// Revalidate authentication when navigating back to a cached panel.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
