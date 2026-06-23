import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const demoUser = existingUsers?.users?.find((u: any) => u.email === "demo@lovable.dev");

  if (demoUser) {
    return new Response(JSON.stringify({ message: "Demo user already exists", userId: demoUser.id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "demo@lovable.dev",
    password: "demo123456",
    email_confirm: true,
    user_metadata: { display_name: "Demo User", timezone: "UTC" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { data: orgData } = await supabaseAdmin
    .from("organizations")
    .insert({ name: "Demo Organization" })
    .select("id")
    .single();

  if (orgData) {
    await supabaseAdmin.from("organization_members").insert({
      organization_id: orgData.id,
      user_id: data.user.id,
      role: "org_admin",
    });
    await supabaseAdmin.from("profiles").update({
      current_organization_id: orgData.id,
    }).eq("user_id", data.user.id);
  }

  return new Response(JSON.stringify({ message: "Demo user created", userId: data.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
