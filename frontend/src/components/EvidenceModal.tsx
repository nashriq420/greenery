'use client';

import { X, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
}

export default function EvidenceModal({ isOpen, onClose, url }: EvidenceModalProps) {
    if (!isOpen || !url) return null;

    const getFileType = (url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';
        if (['pdf'].includes(extension || '')) return 'pdf';
        return 'other';
    };

    const fileType = getFileType(url);
    const fileName = url.split('/').pop();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold truncate pr-4" title={fileName}>
                        Evidence: {fileName}
                    </h3>
                    <div className="flex gap-2">
                        <a href={url} download target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </a>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-950 min-h-[300px]">
                    {fileType === 'image' && (
                        <img
                            src={url}
                            alt="Evidence"
                            className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                        />
                    )}

                    {fileType === 'video' && (
                        <video controls className="max-w-full max-h-[70vh] rounded shadow-sm">
                            <source src={url} />
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {fileType === 'pdf' && (
                        <iframe
                            src={url}
                            className="w-full h-[70vh] border rounded shadow-sm bg-white"
                            title="PDF Viewer"
                        />
                    )}

                    {fileType === 'other' && (
                        <div className="text-center p-8">
                            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-lg font-medium mb-2">File Preview Not Available</p>
                            <p className="text-gray-500 mb-6">This file type cannot be previewed directly.</p>
                            <a href={url} download target="_blank" rel="noreferrer">
                                <Button>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download File
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
