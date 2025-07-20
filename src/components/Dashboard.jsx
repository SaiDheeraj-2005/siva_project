import { useState } from "react";
import Sidebar from "./Sidebar";
import PDFForm from "./WebForm";
import UserManagement from "./UserManagement";
import FormsList from "./FormsList";

// SuperAdmin will have access to all actions, like isAdmin/isMaster
export default function Dashboard({ isAdmin, isMaster, isSuperAdmin }) {
  const [section, setSection] = useState("form");
  return (
    <div className="flex">
      <Sidebar section={section} setSection={setSection} isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 p-6">
        {section === "form" && <PDFForm pdfUrl="/User Access Request Form – FACT ERP.NG V2.0 Main.pdf" formId="form1" />}
        {section === "user" && <UserManagement />}
        {section === "submitted" && <FormsList status="submitted" allowAction={isAdmin || isMaster || isSuperAdmin} />}
        {section === "approved" && <FormsList status="approved" allowAction={false} />}
        {section === "rejected" && <FormsList status="rejected" allowAction={false} />}
      </div>
    </div>
  );
}