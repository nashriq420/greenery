import { CheckCircle2, Star, Zap, TrendingUp, ShieldCheck, Video, MessageSquareHeart, CalendarHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionTab({ subscription }: { subscription?: { status: string; endDate?: string } }) {
    const isActive = subscription?.status === 'ACTIVE';
    const endDateStr = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '31st December 2026';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
                <Card className="w-full max-w-lg border-2 border-primary/20 bg-gradient-to-br from-white to-gray-50/50 shadow-xl relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 ${isActive ? 'bg-green-500/10' : 'bg-primary/10'} rounded-full blur-3xl pointer-events-none`}></div>
                    <div className={`absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 ${isActive ? 'bg-yellow-500/10' : 'bg-blue-500/10'} rounded-full blur-3xl pointer-events-none`}></div>

                    <CardHeader className="text-center pb-2 pt-8">
                        <div className={`mx-auto ${isActive ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-primary/10 text-primary'} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transform rotate-3 shadow-inner`}>
                            <Star className={`w-8 h-8 ${isActive ? 'fill-white' : 'fill-primary'}`} />
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Premium Seller</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {isActive ? 'You are currently enjoying Premium benefits.' : 'Scale your business and stand out from the crowd.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4 pb-8">
                        {!isActive && (
                            <div className="text-center mb-8">
                                <span className="text-5xl font-black text-gray-900">$350</span>
                                <span className="text-gray-500 font-medium ml-2">USD / month</span>
                            </div>
                        )}

                        {isActive && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center gap-4">
                                <div className="bg-green-100 p-2 rounded-full shrink-0">
                                    <CalendarHeart className="w-6 h-6 text-green-700" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-green-900">Active Subscription</h4>
                                    <p className="text-sm text-green-800 tracking-tight">Your Premium perks are active until <strong>{endDateStr}</strong>.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 px-2">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                {isActive ? 'Your Active Perks' : 'Premium Perks Included'}
                            </h4>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-primary/10 p-1 rounded-md text-primary shrink-0"><MessageSquareHeart className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Broadcast Messages</p>
                                    <p className="text-xs text-gray-500">Send updates and promotions directly to all your followers.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-primary/10 p-1 rounded-md text-primary shrink-0"><Star className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Bigger Listing Icon & Premium Label</p>
                                    <p className="text-xs text-gray-500">Stand out on user profiles and search results with premium aesthetics.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-primary/10 p-1 rounded-md text-primary shrink-0"><Zap className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Priority Search Rankings</p>
                                    <p className="text-xs text-gray-500">Your products appear higher in relevant marketplace searches.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-primary/10 p-1 rounded-md text-primary shrink-0"><TrendingUp className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Advanced Analytics Dashboard</p>
                                    <p className="text-xs text-gray-500">Gain deeper insights into customer behavior and listing performance.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-primary/10 p-1 rounded-md text-primary shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Verified Seller Badge</p>
                                    <p className="text-xs text-gray-500">Build instant trust with a verifiable, distinguished profile badge.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-gray-50/50 border-t border-gray-100 flex-col gap-3 py-6">
                        {isActive ? (
                            <Button
                                variant="outline"
                                className="w-full text-base font-semibold py-6 shadow-sm border-gray-300 text-gray-700 hover:bg-gray-100"
                                onClick={() => alert("Manage subscription flow will be integrated here.")}
                            >
                                Manage Subscription
                            </Button>
                        ) : (
                            <>
                                <Button
                                    className="w-full text-base font-semibold py-6 shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all bg-gradient-to-r from-primary to-green-600 focus:ring-4 ring-primary/30"
                                    onClick={() => alert("Subscription flow will be integrated here.")}
                                >
                                    Subscribe Now
                                </Button>
                                <p className="text-xs text-center text-gray-400">Cancel anytime. Terms & conditions apply.</p>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
