import { Listing } from '@/hooks/useMarketplace';

interface ViewListingModalProps {
    listing: Listing | null;
    onClose: () => void;
}

export default function ViewListingModal({ listing, onClose }: ViewListingModalProps) {
    if (!listing) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 pointer-events-none">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 pointer-events-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Listing Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {listing.imageUrl ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                        <p className="text-xl font-bold text-green-600 mt-1">${listing.price}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Description</h4>
                        <p className="text-gray-600 mt-1 text-sm whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
