import { logout } from "@/app/actions";
export default function Inactive() { return <div className="auth-card"><p className="eyebrow">Account access</p><h1>Your account is inactive</h1><p>Please contact a Beautiful Mess Ministries administrator if you believe this is a mistake.</p><form action={logout}><button className="button">Return to login</button></form></div>; }
