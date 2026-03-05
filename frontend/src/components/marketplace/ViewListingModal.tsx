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
                    {/* Media Display */}
                    {listing.videoUrl ? (
                        <div className="w-full h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                            <video src={listing.videoUrl} controls className="w-full h-full object-contain" />
                        </div>
                    ) : listing.imageUrl ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            No Media
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                            {listing.seller?.subscription?.status === 'ACTIVE' && (
                                <span title="Premium Seller" className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] shadow-sm">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {listing.discountPrice ? (
                                <div className="flex items-end gap-2">
                                    <span className="text-xl font-bold text-red-600">RM {listing.discountPrice}</span>
                                    <span className="text-sm text-gray-400 line-through mb-1">RM {listing.price}</span>
                                    {listing.promotionEnd && (
                                        <span className="text-xs text-red-500 mb-1 ml-1 bg-red-50 px-2 py-0.5 rounded-full">
                                            Ends {new Date(listing.promotionEnd).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xl font-bold text-green-600">RM {listing.price}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {listing.sku && (
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">SKU: {listing.sku}</span>
                            )}
                            {listing.deliveryAvailable && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Delivery Available</span>
                            )}
                            {listing.minQuantity && listing.minQuantity > 1 && (
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-semibold">Min Qty: {listing.minQuantity}</span>
                            )}
                            {listing.type && (
                                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold">{listing.type}</span>
                            )}
                            {listing.strainType && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">{listing.strainType}</span>
                            )}
                            {(listing.thcContent || listing.cbdContent) && (
                                <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold border border-blue-100">
                                    {listing.thcContent ? `THC: ${listing.thcContent}%` : ''}
                                    {listing.thcContent && listing.cbdContent ? ' • ' : ''}
                                    {listing.cbdContent ? `CBD: ${listing.cbdContent}%` : ''}
                                </span>
                            )}
                        </div>

                        {(listing.flavors || listing.effects) && (
                            <div className="mt-4 space-y-2">
                                {listing.flavors && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[60px] pt-1">Flavours:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {listing.flavors.split(',').map((flavor, i) => (
                                                <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                                                    {flavor.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {listing.effects && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[60px] pt-1">Effects:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {listing.effects.split(',').map((effect, i) => (
                                                <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">
                                                    {effect.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
