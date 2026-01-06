import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusChangeRequest {
  pengajuan_id: string;
  old_status: string;
  new_status: string;
}

const STATUS_MESSAGES: Record<string, { subject: string; message: string }> = {
  DISETUJUI: {
    subject: "Pengajuan Surat Anda Telah Disetujui",
    message: "Pengajuan surat Anda telah disetujui dan akan segera diproses.",
  },
  DIPROSES: {
    subject: "Pengajuan Surat Anda Sedang Diproses",
    message: "Pengajuan surat Anda sedang dalam proses pembuatan.",
  },
  SELESAI: {
    subject: "Surat Anda Telah Selesai",
    message: "Surat Anda telah selesai dan siap untuk diunduh. Silakan login ke aplikasi SURATKU untuk mengunduh surat Anda.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pengajuan_id, old_status, new_status }: StatusChangeRequest = await req.json();

    console.log(`Status change: ${old_status} -> ${new_status} for pengajuan ${pengajuan_id}`);

    // Get pengajuan details with mahasiswa
    const { data: pengajuan, error: pengajuanError } = await supabase
      .from("pengajuan_surat")
      .select(`
        *,
        mahasiswa:mahasiswa_id (*),
        jenis_surat:jenis_surat_id (*)
      `)
      .eq("id", pengajuan_id)
      .single();

    if (pengajuanError || !pengajuan) {
      throw new Error("Pengajuan not found");
    }

    const email = pengajuan.mahasiswa?.email;
    if (!email) {
      console.log("No email found for mahasiswa");
      return new Response(JSON.stringify({ success: true, message: "No email to send" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const statusInfo = STATUS_MESSAGES[new_status];
    if (!statusInfo) {
      console.log(`No message configured for status: ${new_status}`);
      return new Response(JSON.stringify({ success: true, message: "Status not configured for email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email service not configured",
        would_send_to: email,
        status: new_status 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "SURATKU <onboarding@resend.dev>",
        to: [email],
        subject: `[SURATKU] ${statusInfo.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
              .status-DISETUJUI { background: #dbeafe; color: #1e40af; }
              .status-DIPROSES { background: #e0e7ff; color: #4338ca; }
              .status-SELESAI { background: #dcfce7; color: #166534; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">📄 SURATKU</h1>
                <p style="margin:10px 0 0;">Layanan Surat Kampus</p>
              </div>
              <div class="content">
                <h2>Halo, ${pengajuan.mahasiswa?.nama}!</h2>
                <p>${statusInfo.message}</p>
                
                <div class="info-box">
                  <p><strong>Nomor Pengajuan:</strong> ${pengajuan.nomor_pengajuan}</p>
                  <p><strong>Jenis Surat:</strong> ${pengajuan.jenis_surat?.nama}</p>
                  <p><strong>Status:</strong> <span class="status-badge status-${new_status}">${new_status}</span></p>
                </div>

                ${new_status === "SELESAI" ? `
                <p style="text-align:center;">
                  <a href="${Deno.env.get("SITE_URL") || "https://suratku.lovable.app"}/lacak?nomor=${pengajuan.nomor_pengajuan}" 
                     style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Download Surat
                  </a>
                </p>
                ` : ""}

                <div class="footer">
                  <p>Email ini dikirim secara otomatis oleh sistem SURATKU.</p>
                  <p>Jika Anda tidak merasa melakukan pengajuan ini, abaikan email ini.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.warn("Email sending failed (testing mode - this is expected):", errorData);
      // Don't throw error, just return success with warning
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email not sent (testing mode)", 
        warning: errorData,
        would_send_to: email 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
