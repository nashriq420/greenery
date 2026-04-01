"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ActivityLogs from "@/components/admin/ActivityLogs";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import BlacklistManagement from "@/components/admin/BlacklistManagement";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  MessageSquare,
  ShieldAlert,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  AlertCircle,
  Search,
} from "lucide-react";

// Types
type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN" | "SUPERADMIN";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  sellerProfile?: {
    city: string;
    country: string;
  };
};

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "PENDING" | "ACTIVE" | "SOLD" | "REJECTED";
  seller: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  imageUrl?: string;
  strainType?: string;
  type?: string;
  flavors?: string;
  effects?: string;
  sku?: string;
  thcContent?: number;
  cbdContent?: number;
  deliveryAvailable?: boolean;
  minQuantity?: number;
};

export default function AdminPage() {
  const { token, user } = useAuthStore();

  const router = useRouter();

  const [mainTab, setMainTab] = useState("overview");
  const [search, setSearch] = useState("");

  // Data States
  const [customers, setCustomers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [communityReports, setCommunityReports] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Warning Modal State
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<{
    userId: string;
    listingId?: string;
  } | null>(null);

  // View Listing Modal State
  const [viewListingOpen, setViewListingOpen] = useState(false);
  const [selectedListingForView, setSelectedListingForView] =
    useState<Listing | null>(null);

  const handleViewListing = (listing: Listing) => {
    setSelectedListingForView(listing);
    setViewListingOpen(true);
  };

  const handleWarnUser = (userId: string, listingId?: string) => {
    setSelectedUserForWarning({ userId, listingId });
    setWarningMessage("");
    setWarningOpen(true);
  };

  const submitWarning = async () => {
    if (!selectedUserForWarning || !warningMessage) return;
    try {
      await api.post(
        `/admin/users/${selectedUserForWarning.userId}/warn`,
        {
          message: warningMessage,
          listingId: selectedUserForWarning.listingId,
        },
        token || undefined,
      );
      alert("Warning sent successfully"); // Replaced toast with alert for now as toast setup is unknown
      setWarningOpen(false);
    } catch (e) {
      alert("Failed to send warning");
    }
  };

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch everything in parallel or smart fetch based on tab?
      // For simplicity and small scale, let's fetch based on group
      if (mainTab === "overview") {
        const [custRes, sellRes, listRes, comRes] = await Promise.all([
          api
            .get("/admin/users?role=CUSTOMER", token || undefined)
            .catch(() => []),
          api
            .get("/admin/users?role=SELLER", token || undefined)
            .catch(() => []),
          api.get("/admin/listings", token || undefined).catch(() => []),
          api
            .get("/admin/community/reports", token || undefined)
            .catch(() => []),
        ]);
        if (Array.isArray(custRes)) setCustomers(custRes);
        if (Array.isArray(sellRes)) setSellers(sellRes);
        if (Array.isArray(listRes)) setListings(listRes);
        if (Array.isArray(comRes)) setCommunityReports(comRes);
      } else if (mainTab === "customers") {
        const url = `/admin/users?role=CUSTOMER${search ? `&search=${search}` : ""}`;
        const res = await api.get(url, token || undefined);
        if (Array.isArray(res)) setCustomers(res);
      } else if (mainTab === "sellers") {
        const url = `/admin/users?role=SELLER${search ? `&search=${search}` : ""}`;
        const res = await api.get(url, token || undefined);
        if (Array.isArray(res)) setSellers(res);
      } else if (mainTab === "listings") {
        const url = `/admin/listings?${search ? `search=${search}` : ""}`;
        const res = await api.get(url, token || undefined);
        if (Array.isArray(res)) setListings(res);
      } else if (mainTab === "community") {
        const url = `/admin/community/reports${search ? `?search=${search}` : ""}`;
        const res = await api.get(url, token || undefined);
        if (Array.isArray(res)) setCommunityReports(res);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && mainTab) {
      const timeout = setTimeout(fetchData, 500); // Debounce
      return () => clearTimeout(timeout);
    }
  }, [token, mainTab, search]);

  const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      await api.put(
        `/admin/users/${userId}/status`,
        { status: newStatus },
        token || undefined,
      );
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleListingStatusUpdate = async (
    listingId: string,
    newStatus: string,
  ) => {
    try {
      await api.put(
        `/admin/listings/${listingId}/status`,
        { status: newStatus },
        token || undefined,
      );
      fetchData();
    } catch (err) {
      alert("Failed to update listing status");
    }
  };

  const handlePostStatusUpdate = async (postId: string, newStatus: string) => {
    try {
      await api.put(
        `/admin/posts/${postId}/status`,
        { status: newStatus },
        token || undefined,
      );
      fetchData();
    } catch (err) {
      alert("Failed to update post status");
    }
  };

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN"))
    return null;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-background -mx-6 -my-6">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] z-10 transition-colors">
        <div className="p-6 border-b border-border relative overflow-hidden hidden md:block">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Admin Center
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              BudPlug Management
            </p>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar">
          <SidebarButton
            icon={LayoutDashboard}
            label="Overview"
            isActive={mainTab === "overview"}
            onClick={() => setMainTab("overview")}
          />
          <SidebarButton
            icon={Users}
            label="Customers"
            isActive={mainTab === "customers"}
            onClick={() => setMainTab("customers")}
          />
          <SidebarButton
            icon={Store}
            label="Sellers"
            isActive={mainTab === "sellers"}
            onClick={() => setMainTab("sellers")}
          />
          <SidebarButton
            icon={ShoppingBag}
            label="Listings"
            isActive={mainTab === "listings"}
            onClick={() => setMainTab("listings")}
          />
          <SidebarButton
            icon={MessageSquare}
            label="Community"
            isActive={mainTab === "community"}
            onClick={() => setMainTab("community")}
          />
          <SidebarButton
            icon={ShieldAlert}
            label="Blacklist"
            isActive={mainTab === "blacklist"}
            onClick={() => setMainTab("blacklist")}
          />
          <SidebarButton
            icon={FileText}
            label="Activity Logs"
            isActive={mainTab === "logs"}
            onClick={() => setMainTab("logs")}
          />
        </nav>
      </aside>

      {/* Main Content Space */}
      <main className="flex-1 min-w-0 flex flex-col bg-background md:bg-[#0A0A0A]/30">
        <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8 flex-1">
          {/* Top Bar Area */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/40">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize flex items-center gap-2">
                {mainTab.replace("-", " ")}
              </h1>
            </div>
            {mainTab !== "logs" &&
              mainTab !== "overview" &&
              mainTab !== "blacklist" && (
                <div className="w-full sm:w-auto relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${mainTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-[280px] bg-card border-border pl-9 rounded-full focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                  />
                </div>
              )}
          </div>

          {/* Content Views */}

          {mainTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Customers"
                  value={customers.length}
                  icon={Users}
                  trend="+Active"
                  color="text-blue-500"
                  bgColor="bg-blue-500/10"
                />
                <MetricCard
                  title="Total Sellers"
                  value={sellers.length}
                  icon={Store}
                  trend={`${sellers.filter((s) => s.status === "PENDING").length} Pending`}
                  color="text-purple-500"
                  bgColor="bg-purple-500/10"
                />
                <MetricCard
                  title="Total Listings"
                  value={listings.length}
                  icon={ShoppingBag}
                  trend={`${listings.filter((l) => l.status === "ACTIVE").length} Active`}
                  color="text-green-500"
                  bgColor="bg-green-500/10"
                />
                <MetricCard
                  title="Pending Reports"
                  value={
                    communityReports.filter((r) => r.status === "PENDING")
                      .length
                  }
                  icon={AlertTriangle}
                  trend="Requires Action"
                  color="text-yellow-500"
                  bgColor="bg-yellow-500/10"
                />
                <MetricCard
                  title="Suspended Users"
                  value={
                    sellers.filter((s) => s.status === "SUSPENDED").length +
                    customers.filter((c) => c.status === "SUSPENDED").length
                  }
                  icon={UserX}
                  trend="Platform Banned"
                  color="text-red-500"
                  bgColor="bg-red-500/10"
                />
              </div>
            </div>
          )}

          {mainTab === "customers" && (
            <div className="space-y-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/50 p-1 border border-border/50">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Pending Approval (
                    {customers.filter((c) => c.status === "PENDING").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    All Customers ({customers.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <UserGroupList
                    users={customers.filter((c) => c.status === "PENDING")}
                    type="CUSTOMER"
                    isPending={true}
                    onUpdateStatus={handleUserStatusUpdate}
                    onWarn={handleWarnUser}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <UserGroupList
                    users={customers}
                    type="CUSTOMER"
                    isPending={false}
                    onUpdateStatus={handleUserStatusUpdate}
                    onWarn={handleWarnUser}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {mainTab === "sellers" && (
            <div className="space-y-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/50 p-1 border border-border/50">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Pending Approval (
                    {sellers.filter((c) => c.status === "PENDING").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    All Sellers ({sellers.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <UserGroupList
                    users={sellers.filter((c) => c.status === "PENDING")}
                    type="SELLER"
                    isPending={true}
                    onUpdateStatus={handleUserStatusUpdate}
                    onWarn={handleWarnUser}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <UserGroupList
                    users={sellers}
                    type="SELLER"
                    isPending={false}
                    onUpdateStatus={handleUserStatusUpdate}
                    onWarn={handleWarnUser}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {mainTab === "listings" && (
            <div className="space-y-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/50 p-1 border border-border/50">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Pending Approval (
                    {listings.filter((l) => l.status === "PENDING").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    All Listings ({listings.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <ListingGroupList
                    listings={listings.filter((l) => l.status === "PENDING")}
                    isPending={true}
                    onUpdateStatus={handleListingStatusUpdate}
                    onWarnSeller={handleWarnUser}
                    onViewListing={handleViewListing}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <ListingGroupList
                    listings={listings}
                    isPending={false}
                    onUpdateStatus={handleListingStatusUpdate}
                    onWarnSeller={handleWarnUser}
                    onViewListing={handleViewListing}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {mainTab === "community" && (
            <div className="space-y-6">
              <Tabs defaultValue="PENDING" className="w-full">
                <TabsList className="bg-muted/50 p-1 border border-border/50">
                  <TabsTrigger
                    value="PENDING"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Pending Approval (
                    {
                      communityReports.filter((r) => r.status === "PENDING")
                        .length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger
                    value="REVIEWED"
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Reviewed (
                    {
                      communityReports.filter((r) => r.status === "REVIEWED")
                        .length
                    }
                    )
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="PENDING" className="mt-4">
                  <CommunityReportsList
                    reports={communityReports.filter(
                      (r) => r.status === "PENDING",
                    )}
                    onUpdatePostStatus={handlePostStatusUpdate}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="REVIEWED" className="mt-4">
                  <CommunityReportsList
                    reports={communityReports.filter(
                      (r) => r.status === "REVIEWED",
                    )}
                    onUpdatePostStatus={handlePostStatusUpdate}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {mainTab === "blacklist" && (
            <div className="space-y-6">
              <BlacklistManagement />
            </div>
          )}

          {mainTab === "logs" && (
            <div className="space-y-6">
              <ActivityLogs token={token} />
            </div>
          )}
        </div>

        {/* Warning Modal */}
        {warningOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Send Warning</CardTitle>
                <CardDescription>
                  Send a strict warning to this user via the chat system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full border rounded-md p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Enter warning message..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setWarningOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitWarning} variant="destructive">
                    Send Warning
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Listing Modal */}
        {viewListingOpen && selectedListingForView && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
                <div>
                  <CardTitle className="text-xl">
                    {selectedListingForView.title}
                  </CardTitle>
                  <CardDescription>Listing Details</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="h-12 w-12 rounded-full hover:bg-muted shrink-0"
                  onClick={() => setViewListingOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="w-8 h-8 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {selectedListingForView.imageUrl && (
                  <div className="w-full h-64 relative rounded-md overflow-hidden bg-muted">
                    <img
                      src={selectedListingForView.imageUrl}
                      alt={selectedListingForView.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground font-medium">
                      Price
                    </span>
                    <p className="font-semibold text-lg text-foreground">
                      ${Number(selectedListingForView.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground font-medium">
                      Status
                    </span>
                    <div>
                      <StatusBadge status={selectedListingForView.status} />
                    </div>
                  </div>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <span className="text-sm text-muted-foreground font-medium">
                      Description
                    </span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedListingForView.description}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground font-medium">
                      Seller
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {selectedListingForView.seller?.name}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {selectedListingForView.seller?.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground font-medium">
                      Created At
                    </span>
                    <p className="text-sm text-foreground">
                      {new Date(
                        selectedListingForView.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* Cannabis Metadata & Extras */}
                  {selectedListingForView.type && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Type
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.type}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.strainType && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Strain
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.strainType}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.flavors && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Flavors
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.flavors}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.effects && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Effects
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.effects}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.thcContent !== undefined &&
                    selectedListingForView.thcContent !== null && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground font-medium">
                          THC Content
                        </span>
                        <p className="text-sm text-foreground">
                          {selectedListingForView.thcContent}%
                        </p>
                      </div>
                    )}
                  {selectedListingForView.cbdContent !== undefined &&
                    selectedListingForView.cbdContent !== null && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground font-medium">
                          CBD Content
                        </span>
                        <p className="text-sm text-foreground">
                          {selectedListingForView.cbdContent}%
                        </p>
                      </div>
                    )}
                  {selectedListingForView.sku && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        SKU
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.sku}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.minQuantity !== undefined && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Min Quantity
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedListingForView.minQuantity}
                      </p>
                    </div>
                  )}
                  {selectedListingForView.deliveryAvailable && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground font-medium">
                        Delivery
                      </span>
                      <p className="text-sm text-green-600 font-medium">
                        Available
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB COMPONENTS
// ----------------------------------------------------------------------

function UserGroupList({
  users,
  type,
  isPending,
  onUpdateStatus,
  onWarn,
  loading,
}: any) {
  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading data...
      </div>
    );

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No {type.toLowerCase()}s found in this category.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {users.map((u: any) => (
        <Card key={u.id} className="overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{u.name}</span>
                <StatusBadge status={u.status} />
              </div>
              <div className="text-sm text-gray-500">{u.email}</div>
              {u.sellerProfile && (
                <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded">
                  📍 {u.sellerProfile.city}, {u.sellerProfile.country}
                </div>
              )}
              <div className="text-xs text-gray-400 pt-1">
                Signed up: {new Date(u.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {isPending ? (
                <>
                  <Button
                    onClick={() => onUpdateStatus(u.id, "ACTIVE")}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(u.id, "REJECTED")}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWarn(u.id)}
                    className="w-full sm:w-auto"
                  >
                    ⚠️ Warn
                  </Button>
                  {u.status === "ACTIVE" ? (
                    <Button
                      onClick={() => onUpdateStatus(u.id, "SUSPENDED")}
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onUpdateStatus(u.id, "ACTIVE")}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                    >
                      Re-Activate
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ListingGroupList({
  listings,
  isPending,
  onUpdateStatus,
  onWarnSeller,
  onViewListing,
  loading,
}: any) {
  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading data...
      </div>
    );

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No listings found in this category.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {listings.map((l: any) => (
        <Card key={l.id} className="overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{l.title}</span>
                <StatusBadge status={l.status} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                ${l.price}
              </div>
              <div className="text-sm text-gray-500 line-clamp-1 max-w-md">
                {l.description}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                Seller: {l.seller?.name || "Unknown"} ({l.seller?.email})
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewListing?.(l)}
                className="w-full sm:w-auto"
              >
                👁️ View
              </Button>
              {isPending ? (
                <>
                  <Button
                    onClick={() => onUpdateStatus(l.id, "ACTIVE")}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(l.id, "REJECTED")}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWarnSeller(l.seller?.id, l.id)}
                    className="w-full sm:w-auto"
                  >
                    ⚠️ Warn Seller
                  </Button>
                  {l.status === "ACTIVE" ? (
                    <Button
                      onClick={() => onUpdateStatus(l.id, "REJECTED")}
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onUpdateStatus(l.id, "ACTIVE")}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                    >
                      Re-Activate
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CommunityReportsList({ reports, onUpdatePostStatus, loading }: any) {
  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading data...
      </div>
    );

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No reports found in this status.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map((r: any) => (
        <Card key={r.id} className="overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2 flex-1 w-full max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded uppercase">
                  {r.reason}
                </span>
                <span className="text-xs text-muted-foreground">
                  Reported {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              {r.details && (
                <p className="text-sm text-foreground italic border-l-2 border-border pl-2">
                  "{r.details}"
                </p>
              )}

              <div className="bg-muted p-3 flex gap-4 rounded-lg border border-border mt-3 relative">
                {r.post.status === "SUSPENDED" && (
                  <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center border border-red-500/50">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Suspended Post
                    </span>
                  </div>
                )}
                {r.post.imageUrl && (
                  <img
                    src={r.post.imageUrl}
                    className="w-16 h-16 object-cover rounded-md shrink-0 border border-border"
                    alt=""
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Posted by {r.post.author.name} · Tag: {r.post.tag || "None"}
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {r.post.content}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0 z-20">
              {r.post.status === "ACTIVE" ? (
                <Button
                  onClick={() => onUpdatePostStatus(r.post.id, "SUSPENDED")}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  Suspend Post
                </Button>
              ) : (
                <Button
                  onClick={() => onUpdatePostStatus(r.post.id, "ACTIVE")}
                  variant="outline"
                  className="w-full sm:w-auto text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  Restore Post
                </Button>
              )}
              <div className="text-[10px] text-muted-foreground text-center mt-1">
                Reporter: {r.reporter?.name || "Unknown"}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    ACTIVE: "bg-green-500/10 text-green-600 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
    SUSPENDED: "bg-red-500/10 text-red-600 border-red-500/20",
    SOLD: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  const defaultStyle = "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || defaultStyle}`}
    >
      {status}
    </span>
  );
}

function SidebarButton({ icon: Icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, bgColor }: any) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="font-medium text-muted-foreground">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
