import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileCheck, Loader2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15 disabled:bg-slate-50 disabled:text-slate-500';
const refereesRequired = import.meta.env.VITE_REQUIRE_MEMBERSHIP_REFEREES === 'true';

const filePayload = (file: File) => new Promise<{ fileName: string; mimeType: string; data: string }>((resolve, reject) => {
  if (file.size > 2 * 1024 * 1024) return reject(new Error(`${file.name} exceeds the 2 MB upload limit.`));
  const reader = new FileReader();
  reader.onload = () => resolve({ fileName: file.name, mimeType: file.type, data: String(reader.result) });
  reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
  reader.readAsDataURL(file);
});

export const Register: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const employee = state?.employee;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validId, setValidId] = useState<File | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    companyName: employee?.companyName || 'OICL',
    position: employee?.jobTitle || '',
    dateOfBirth: '', gender: '', phoneNumber: employee?.phoneNumber || '', residentialAddress: '',
    nextOfKinName: '', nextOfKinRelationship: '', nextOfKinPhone: '',
    bankName: '', accountName: employee ? `${employee.firstName} ${employee.lastName}` : '', accountNumber: '',
    monthlyContribution: 8000, targetSavingsContribution: 0,
    refereeStaffId1: '', refereeStaffId2: '',
    password: '', confirmPassword: '', declarationAccepted: false,
  });

  useEffect(() => {
    if (!employee) navigate('/activate-membership', { replace: true });
  }, [employee, navigate]);

  const setField = (field: string, value: string | number | boolean) => setForm(current => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must contain at least 8 characters.');
    if (!validId || !passportPhoto) return setError('A valid ID and passport photograph are required.');
    if (refereesRequired && form.refereeStaffId1.trim().toUpperCase() === form.refereeStaffId2.trim().toUpperCase()) return setError('Enter two different referee staff IDs.');

    setLoading(true);
    try {
      const [validIdData, passportPhotoData] = await Promise.all([filePayload(validId), filePayload(passportPhoto)]);
      const response = await api.auth.register({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        officialEmail: employee.officialEmail,
        department: employee.department,
        ...form,
        refereeStaffId1: form.refereeStaffId1.trim(),
        refereeStaffId2: form.refereeStaffId2.trim(),
        validId: validIdData,
        passportPhoto: passportPhotoData,
      });
      alert(response.message);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Unable to submit the membership application.');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-emerald-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <Logo className="h-12 w-12" inverse />
          <div>
            <p className="text-sm font-medium text-emerald-100">Odu'a Investment (Ibadan) Staff CICS</p>
            <h1 className="mt-1 text-2xl font-semibold">Membership registration</h1>
            <p className="mt-2 text-sm leading-5 text-emerald-50/80">Fields marked * are mandatory. EXCO reviews complete applications within 3 working days.</p>
          </div>
        </div>

        <div className="space-y-10 p-6 sm:p-10">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>HR identity verified for <strong>{employee.firstName} {employee.lastName}</strong> ({employee.employeeId}).</p>
          </div>

          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">A. Personal information</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">Applicant Name *<input className={inputClass} value={`${employee.firstName} ${employee.lastName}`} disabled /></label>
              <label className="text-xs font-bold text-slate-600">Company Name *<input className={inputClass} value={form.companyName} onChange={e => setField('companyName', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Staff ID *<input className={inputClass} value={employee.employeeId} disabled /></label>
              <label className="text-xs font-bold text-slate-600">Department *<input className={inputClass} value={employee.department} disabled /></label>
              <label className="text-xs font-bold text-slate-600">Position / Job Title *<input className={inputClass} value={form.position} onChange={e => setField('position', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Date of Birth *<input type="date" className={inputClass} value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Gender *<select className={inputClass} value={form.gender} onChange={e => setField('gender', e.target.value)} required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
              <label className="text-xs font-bold text-slate-600">Mobile / WhatsApp *<input type="tel" inputMode="tel" className={inputClass} value={form.phoneNumber} onChange={e => setField('phoneNumber', e.target.value)} placeholder="e.g. 08012345678" required /></label>
              <label className="text-xs font-bold text-slate-600">Official Email *<input className={inputClass} value={employee.officialEmail} disabled /></label>
              <label className="text-xs font-bold text-slate-600 md:col-span-2 lg:col-span-3">Residential Address *<textarea className={inputClass} value={form.residentialAddress} onChange={e => setField('residentialAddress', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Next of Kin Name *<input className={inputClass} value={form.nextOfKinName} onChange={e => setField('nextOfKinName', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Relationship *<input className={inputClass} value={form.nextOfKinRelationship} onChange={e => setField('nextOfKinRelationship', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Next of Kin Contact *<input className={inputClass} value={form.nextOfKinPhone} onChange={e => setField('nextOfKinPhone', e.target.value)} required /></label>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">B. Contribution & banking details</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">Monthly Ordinary Savings (Min. N8,000) *<input type="number" min="8000" className={inputClass} value={form.monthlyContribution} onChange={e => setField('monthlyContribution', Number(e.target.value))} required /></label>
              <label className="text-xs font-bold text-slate-600">Optional Target Savings<input type="number" min="0" className={inputClass} value={form.targetSavingsContribution} onChange={e => setField('targetSavingsContribution', Number(e.target.value))} /></label>
              <label className="text-xs font-bold text-slate-600">Deduction Method<input className={inputClass} value="Salary deduction" disabled /></label>
              <label className="text-xs font-bold text-slate-600">Bank Name *<input className={inputClass} value={form.bankName} onChange={e => setField('bankName', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Account Name *<input className={inputClass} value={form.accountName} onChange={e => setField('accountName', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Account Number *<input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className={inputClass} value={form.accountNumber} onChange={e => setField('accountNumber', e.target.value)} required /></label>
              {refereesRequired ? <>
                <label className="text-xs font-bold text-slate-600">Referee 1 Staff ID *<input className={inputClass} value={form.refereeStaffId1} onChange={e => setField('refereeStaffId1', e.target.value)} required /></label>
                <label className="text-xs font-bold text-slate-600">Referee 2 Staff ID *<input className={inputClass} value={form.refereeStaffId2} onChange={e => setField('refereeStaffId2', e.target.value)} required /></label>
                <div className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-800">Both referees must be current active Society members.</div>
              </> : (
                <div className="rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 md:col-span-2 lg:col-span-3">The referee requirement is temporarily paused.</div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">C. Required documents & account security</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-700"><FileCheck className="mb-2 h-5 w-5 text-emerald-800" />Valid Staff / Government ID *<input type="file" accept="image/jpeg,image/png,application/pdf" className="mt-3 block w-full text-xs" onChange={e => setValidId(e.target.files?.[0] || null)} required /></label>
              <label className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-700"><FileCheck className="mb-2 h-5 w-5 text-emerald-800" />Passport photograph *<input type="file" accept="image/jpeg,image/png" className="mt-3 block w-full text-xs" onChange={e => setPassportPhoto(e.target.files?.[0] || null)} required /></label>
              <label className="text-xs font-bold text-slate-600">Password *<input type="password" minLength={8} className={inputClass} value={form.password} onChange={e => setField('password', e.target.value)} required /></label>
              <label className="text-xs font-bold text-slate-600">Confirm Password *<input type="password" minLength={8} className={inputClass} value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} required /></label>
            </div>
          </section>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-800" checked={form.declarationAccepted} onChange={e => setField('declarationAccepted', e.target.checked)} required />
            <span>I confirm that the information provided is true and consent to salary deductions for my stated contribution. I agree to comply with the Society's Constitution, SOP, and applicable regulations.</span>
          </label>

          {error && <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserPlus className="h-5 w-5" /> Submit Membership Application</>}
          </button>
        </div>
      </form>
    </div>
  );
};
