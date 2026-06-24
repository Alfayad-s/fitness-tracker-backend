export type OtpEmailPurpose = 'login' | 'register' | 'reset-password';

interface OtpEmailContent {
  subject: string;
  title: string;
  description: string;
  codeLabel: string;
  text: string;
}

const contentByPurpose: Record<OtpEmailPurpose, OtpEmailContent> = {
  login: {
    subject: 'Your Fitness Tracker login code',
    title: "You're in!",
    description:
      'Use the code below to log in to your Fitness Tracker account. This code expires in <strong style="color:#1a1a1a;">10 minutes</strong>.',
    codeLabel: 'Your login code',
    text: 'Your login code is: {otp}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.',
  },
  register: {
    subject: 'Complete your Fitness Tracker registration',
    title: 'Welcome aboard!',
    description:
      'Use the code below to verify your email and continue setting up your Fitness Tracker account. This code expires in <strong style="color:#1a1a1a;">10 minutes</strong>.',
    codeLabel: 'Your registration code',
    text: 'Your registration code is: {otp}\n\nEnter this code to continue setting up your account. This code expires in 10 minutes.',
  },
  'reset-password': {
    subject: 'Reset your Fitness Tracker password',
    title: 'Reset your password',
    description:
      'Use the code below to verify your identity and reset your password. This code expires in <strong style="color:#1a1a1a;">10 minutes</strong>.',
    codeLabel: 'Your reset code',
    text: 'Your password reset code is: {otp}\n\nEnter this code to set a new password. This code expires in 10 minutes. If you did not request this, you can ignore this email.',
  },
};

function formatOtp(otp: string): string {
  return otp.length === 6 ? `${otp.slice(0, 3)} ${otp.slice(3)}` : otp;
}

export function buildOtpEmailText(otp: string, purpose: OtpEmailPurpose): string {
  return contentByPurpose[purpose].text.replace('{otp}', otp);
}

export function buildOtpEmailSubject(purpose: OtpEmailPurpose): string {
  return contentByPurpose[purpose].subject;
}

export function buildOtpEmailHtml(
  otp: string,
  purpose: OtpEmailPurpose,
): string {
  const content = contentByPurpose[purpose];
  const formattedOtp = formatOtp(otp);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${content.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">

        <tr>
          <td align="center" style="background:#5B54D6;padding:32px 24px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.15);line-height:56px;text-align:center;font-size:28px;">🏃</div>
            <p style="color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin:12px 0 0;">Fitness Tracker</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 32px 0;">
            <h1 style="font-size:22px;font-weight:600;margin:0 0 8px;color:#1a1a1a;">${content.title}</h1>
            <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">
              ${content.description}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:10px;border:1px solid #e5e5e5;margin-bottom:24px;">
              <tr>
                <td align="center" style="padding:24px;">
                  <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">${content.codeLabel}</p>
                  <p style="font-size:36px;font-weight:700;letter-spacing:0.2em;font-family:monospace;color:#1a1a1a;margin:0 0 16px;">${formattedOtp}</p>
                  <a href="javascript:void(0)"
                    onclick="navigator.clipboard.writeText('${otp}').then(()=>{this.textContent='✓ Copied!';this.style.background='#3B6D11';setTimeout(()=>{this.textContent='Copy code';this.style.background='#5B54D6';},2000)})"
                    style="display:inline-block;background:#5B54D6;color:#fff;text-decoration:none;font-size:13px;padding:9px 20px;border-radius:8px;font-family:sans-serif;">
                    Copy code
                  </a>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="border-left:3px solid #5B54D6;background:#EEEDFE;padding:12px 16px;border-radius:0 8px 8px 0;">
                  <p style="font-size:13px;color:#3C3489;margin:0;line-height:1.6;">
                    If you did not request this code, you can safely ignore this email. Never share this code with anyone.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px;border-top:1px solid #efefef;text-align:center;">
            <p style="font-size:12px;color:#aaa;margin:0;">Sent by Fitness Tracker</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
