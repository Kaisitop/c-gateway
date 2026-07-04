function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

export function buildResetPasswordBridgeHtml(options: {
  token: string;
  appResetUrl: string;
  androidIntentUrl: string;
  androidAppPackage: string;
}): string {
  const token = options.token.trim();
  const appResetUrl = escapeHtml(options.appResetUrl);
  const androidIntentUrl = escapeHtml(options.androidIntentUrl);
  const tokenHtml = escapeHtml(token);
  const tokenJs = escapeJsString(token);
  const packageJs = escapeJsString(options.androidAppPackage);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Abrir Centinela</title>
  <style>
    body {
      margin: 0;
      font-family: Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 28px;
      box-sizing: border-box;
    }
    h1 { margin: 0 0 12px; font-size: 22px; }
    p { margin: 0 0 16px; color: #94a3b8; line-height: 1.5; font-size: 15px; }
    .btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      background: #6366f1;
      color: #fff;
      text-decoration: none;
      padding: 14px 18px;
      border-radius: 10px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid #475569;
      color: #cbd5e1;
    }
    .token {
      word-break: break-all;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      font-family: Consolas, Monaco, monospace;
      font-size: 13px;
      color: #f8fafc;
    }
    .hint { font-size: 13px; color: #64748b; margin-top: 16px; }
  </style>
  <script>
    function openCentinelaApp() {
      var token = '${tokenJs}';
      var pkg = '${packageJs}';
      var intentUrl =
        'intent://reset-password?token=' + encodeURIComponent(token) +
        '#Intent;scheme=centinela;package=' + pkg + ';end';
      var customUrl = 'centinela://reset-password?token=' + encodeURIComponent(token);
      window.location.href = intentUrl;
      setTimeout(function () {
        window.location.href = customUrl;
      }, 700);
    }
    window.addEventListener('load', function () {
      setTimeout(openCentinelaApp, 300);
    });
  </script>
</head>
<body>
  <div class="card">
    <h1>Restablecer contraseña</h1>
    <p>Estamos abriendo la app Centinela en tu teléfono. Si no se abre sola, toca el botón morado.</p>
    <a class="btn" href="${androidIntentUrl}" onclick="openCentinelaApp(); return false;">Abrir Centinela</a>
    <a class="btn btn-secondary" href="${appResetUrl}">Abrir con enlace directo</a>
    <p class="hint">Si nada funciona, copia este token en la app → ¿Olvidaste tu contraseña? → Ingresar token manualmente:</p>
    <div class="token">${tokenHtml}</div>
  </div>
</body>
</html>`;
}

export function buildResetPasswordBridgeErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enlace inválido</title>
  <style>
    body { font-family: sans-serif; background:#0f172a; color:#e2e8f0; padding:24px; }
    .card { max-width:420px; margin:40px auto; background:#1e293b; padding:24px; border-radius:12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Enlace inválido</h1>
    <p>${escapeHtml(message)}</p>
    <p>Solicita un nuevo correo desde la app Centinela.</p>
  </div>
</body>
</html>`;
}
