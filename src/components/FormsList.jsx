import { useState } from "react";
import { getAllSubmissions, updateSubmission } from "../utils/api";

export default function FormsList({ status, allowAction }) {
  const [submissions, setSubmissions] = useState(getAllSubmissions().filter(f => f.status === status));
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");

  const handleAction = (idx, newStatus) => {
    updateSubmission(idx, { status: newStatus, comments: comment });
    setSubmissions(getAllSubmissions().filter(f => f.status === status));
    setSelected(null);
    setComment("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3 capitalize">{status} Forms</h2>
      <ul>
        {submissions.map((sub, i) => (
          <li key={i} className="mb-3 border shadow p-4 rounded">
            <div className="flex justify-between">
              <span><b>{sub.fields.firstName} {sub.fields.lastName}</b> - {sub.fields.department}</span>
              <span className="px-2 py-1 rounded text-xs bg-gray-200">{sub.status}</span>
            </div>
            <div className="text-xs text-gray-600">Submitted: {new Date(sub.submittedAt).toLocaleString()}</div>
            <button className="mt-2 bg-blue-600 text-white px-3 py-1 rounded" onClick={() => setSelected(i)}>Review</button>
          </li>
        ))}
      </ul>
      {selected !== null && (
        <div className="bg-white shadow rounded p-4 mt-6">
          <h3 className="text-lg font-bold mb-2">Review Submission</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm mb-2">{JSON.stringify(submissions[selected].fields, null, 2)}</pre>
          <div>
            <img src={submissions[selected].signature} alt="signature" className="h-16 border mb-2" />
          </div>
          <textarea className="border w-full p-2 mb-2" rows="3"
            placeholder="Comments for user (optional)" value={comment}
            onChange={e => setComment(e.target.value)} />
          {allowAction && (
            <div>
              <button className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                onClick={() => handleAction(selected, "approved")}>Approve</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => handleAction(selected, "rejected")}>Reject</button>
            </div>
          )}
          <button className="bg-gray-300 text-black px-3 py-1 rounded ml-2"
            onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </div>
  );
}