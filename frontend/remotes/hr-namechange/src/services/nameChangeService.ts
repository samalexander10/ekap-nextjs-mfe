const HR_URL = 'http://localhost:8081';
export async function submitNameChange(previousName: string, newLastName: string, documentType: string, file: File): Promise<{ id: string; status: string }> {
  const form = new FormData();
  form.append('employeeId', 'emp-001');
  form.append('previousName', previousName);
  form.append('newLastName', newLastName);
  form.append('documentType', documentType);
  form.append('file', file);
  const res = await fetch(`${HR_URL}/hr/name-change`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
