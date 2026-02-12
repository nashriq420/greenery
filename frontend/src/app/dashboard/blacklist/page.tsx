
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';

interface BlacklistReport {
    id: string;
    username: string;
    region: string;
    contactInfo: string;
    description: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    updatedAt: string;
    reporter?: {
        name: string;
    };
}

import { useSearchParams } from 'next/navigation';

export default function BlacklistPage() {
    const { token } = useAuthStore();
    const [reports, setReports] = useState<BlacklistReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('list');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'report') {
            setActiveTab('report');
        }
    }, [searchParams]);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        region: '',
        contactInfo: '',
        description: ''
    });
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await api.get('/blacklist', token || undefined);
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch blacklist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus('idle');
        setFormError('');

        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('region', formData.region);
            data.append('contactInfo', formData.contactInfo);
            data.append('description', formData.description);

            if (evidenceFile) {
                if (evidenceFile.size > 10 * 1024 * 1024) {
                    throw new Error("File size must be less than 10MB");
                }
                data.append('evidence', evidenceFile);
            }

            await api.upload('/blacklist', data, token || undefined);
            setSubmitStatus('success');
            setFormData({ username: '', region: '', contactInfo: '', description: '' });
            setEvidenceFile(null);
        } catch (error: any) {
            console.error('Failed to submit report:', error);
            setSubmitStatus('error');
            setFormError(error.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReports = reports.filter(report =>
        report.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.contactInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Community Safety</h1>
                <p className="text-gray-500">Check the blacklist or report suspicious activity to keep the community safe.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="list">Blacklist</TabsTrigger>
                    <TabsTrigger value="report">Report Scammer</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 max-w-sm">
                        <Search className="w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search by username, contact, or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : filteredReports.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <p>No reports found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredReports.map((report) => (
                                <Card key={report.id} className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">{report.username}</h3>
                                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                                Scammer
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 mb-3">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2 border-b border-gray-100 pb-2">
                                                <span>Reported: {new Date(report.updatedAt).toLocaleDateString()}</span>
                                            </div>

                                            {report.region && (
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <span className="font-semibold text-gray-500 w-16 text-xs uppercase tracking-wider">Region</span>
                                                    <span className="font-medium">{report.region}</span>
                                                </div>
                                            )}
                                            {report.contactInfo && (
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <span className="font-semibold text-gray-500 w-16 text-xs uppercase tracking-wider">Contact</span>
                                                    <span className="font-mono bg-gray-50 px-1 rounded text-red-600">{report.contactInfo}</span>
                                                </div>
                                            )}
                                        </div>

                                        {report.description && (
                                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic line-clamp-3">
                                                "{report.description}"
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="report" className="mt-4">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Report a Scammer</CardTitle>
                            <CardDescription>
                                Submit details about a potential scammer. Your report will be reviewed by admins before being listed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submitStatus === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                    <h3 className="text-xl font-semibold text-green-700">Report Submitted</h3>
                                    <p className="text-gray-600">Thank you for helping keep the community safe. Your report is under review.</p>
                                    <Button onClick={() => setSubmitStatus('idle')} variant="outline">Submit Another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Scammer Username *</label>
                                        <Input
                                            required
                                            placeholder="e.g. Scammer123"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Region / Location</label>
                                            <Input
                                                placeholder="e.g. New York, USA"
                                                value={formData.region}
                                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Known Contact Info</label>
                                            <Input
                                                placeholder="Phone, Email, or Social Handle"
                                                value={formData.contactInfo}
                                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Description / Details *</label>
                                        <Textarea
                                            required
                                            placeholder="Describe what happened..."
                                            className="min-h-[100px]"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Evidence (Optional, Max 10MB)</label>
                                        <Input
                                            type="file"
                                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                            onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                        <p className="text-xs text-gray-500">Allowed: Images, Videos, PDF, Documents</p>
                                    </div>

                                    {submitStatus === 'error' && (
                                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm">{formError || 'Failed to submit report. Please try again.'}</span>
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit Report'}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
