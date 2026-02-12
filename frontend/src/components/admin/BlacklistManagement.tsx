
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface BlacklistReport {
    id: string;
    username: string;
    region: string;
    contactInfo: string;
    description: string;
    evidenceUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    reporter?: {
        name: string;
        email: string;
    };
    adminComment?: string;
}

import EvidenceModal from '@/components/EvidenceModal';

export default function BlacklistManagement() {
    const { token } = useAuthStore();
    const [reports, setReports] = useState<BlacklistReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await api.get('/blacklist/admin', token || undefined);
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch admin blacklist reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessing(id);
        try {
            await api.put(`/blacklist/admin/${id}`, { status }, token || undefined);
            // Update local state
            setReports(reports.map(r => r.id === id ? { ...r, status } : r));
        } catch (error) {
            console.error('Failed to update report status:', error);
            alert('Failed to update status');
        } finally {
            setProcessing(null);
        }
    };

    const pendingReports = reports.filter(r => r.status === 'PENDING');
    const historyReports = reports.filter(r => r.status !== 'PENDING');

    const getFullEvidenceUrl = (url: string) => {
        return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${url}`;
    };

    return (
        <div className="space-y-8">
            <EvidenceModal
                isOpen={!!evidenceUrl}
                onClose={() => setEvidenceUrl(null)}
                url={evidenceUrl}
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Blacklist Management</h1>
                <p className="text-gray-500">Review and manage reported scammers.</p>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    Pending Reviews <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{pendingReports.length}</span>
                </h2>

                {pendingReports.length === 0 ? (
                    <Card><CardContent className="py-8 text-center text-gray-500">No pending reports.</CardContent></Card>
                ) : (
                    <div className="grid gap-4">
                        {pendingReports.map((report) => (
                            <Card key={report.id} className="border-l-4 border-l-yellow-400">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{report.username}</CardTitle>
                                            <CardDescription className="text-sm">
                                                Reported by {report.reporter?.name || 'Anonymous'} on {new Date(report.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                disabled={processing === report.id}
                                                onClick={() => handleUpdateStatus(report.id, 'APPROVED')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={processing === report.id}
                                                onClick={() => handleUpdateStatus(report.id, 'REJECTED')}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><span className="font-semibold">Region:</span> {report.region}</div>
                                        <div><span className="font-semibold">Contact:</span> {report.contactInfo}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded mt-2">
                                        <div className="font-semibold mb-1">Details:</div>
                                        {report.description}
                                    </div>
                                    {report.evidenceUrl && (
                                        <div>
                                            <span className="font-semibold">Evidence:</span>
                                            <button
                                                onClick={() => setEvidenceUrl(getFullEvidenceUrl(report.evidenceUrl!))}
                                                className="text-blue-600 underline ml-1 hover:text-blue-800"
                                            >
                                                View Evidence
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">History</h2>

                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-4">
                    {historyReports.length === 0 ? (
                        <Card><CardContent className="py-8 text-center text-gray-500">No history found.</CardContent></Card>
                    ) : (
                        historyReports.map((report) => (
                            <Card key={report.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{report.username}</CardTitle>
                                            <CardDescription className="text-sm">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><span className="font-semibold">Region:</span> {report.region}</div>
                                        <div><span className="font-semibold">Reporter:</span> {report.reporter?.name || 'Anonymous'}</div>
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={processing === report.id}
                                            onClick={() => handleUpdateStatus(report.id, report.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                                        >
                                            {report.status === 'APPROVED' ? 'Revoke' : 'Re-Approve'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-3 font-medium text-gray-500">Scammer</th>
                                <th className="text-left p-3 font-medium text-gray-500">Region</th>
                                <th className="text-left p-3 font-medium text-gray-500">Reporter</th>
                                <th className="text-left p-3 font-medium text-gray-500">Date</th>
                                <th className="text-left p-3 font-medium text-gray-500">Status</th>
                                <th className="text-right p-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {historyReports.map((report) => (
                                <tr key={report.id}>
                                    <td className="p-3 font-medium">{report.username}</td>
                                    <td className="p-3 text-gray-600">{report.region}</td>
                                    <td className="p-3 text-gray-600">{report.reporter?.name || 'Anonymous'}</td>
                                    <td className="p-3 text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={processing === report.id}
                                            onClick={() => handleUpdateStatus(report.id, report.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                                        >
                                            {report.status === 'APPROVED' ? 'Revoke' : 'Re-Approve'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {historyReports.length === 0 && <div className="p-4 text-center text-gray-500">No history found.</div>}
                </div>
            </section>
        </div>
    );
}
