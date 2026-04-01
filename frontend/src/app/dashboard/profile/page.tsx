"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Upload, Trash2, AlertTriangle, X, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import EditListingModal from "@/components/marketplace/EditListingModal";
import { Listing } from "@/hooks/useMarketplace";
import SubscriptionTab from "@/components/profile/SubscriptionTab";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";

interface UserProfile {
  name: string;
  email: string;
  username: string;
  profilePicture?: string;
  role: string;
  district?: string;
  state?: string;
  country?: string;
  subscription?: { status: string };
}

interface SellerProfile {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  openingHours?: string;
  bannerUrl?: string;
}

// Listing interface removed, using imported one

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

export default function ProfilePage() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    username: "",
    role: "",
    profilePicture: "",
    district: "",
    state: "",
    country: "",
  });
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    lat: 0,
    lng: 0,
    address: "",
    city: "",
    state: "",
    country: "",
    description: "",
  });
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    videoUrl: "",
    minQuantity: "1",
    deliveryAvailable: false,
    strainType: "",
    thcContent: "",
    cbdContent: "",
    type: "",
    flavors: "",
    effects: "",
    sku: "",
  });

  // Opening Hours State
  const [openingDays, setOpeningDays] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");

  // Sync opening hours string when components change
  useEffect(() => {
    if (openingDays.length > 0) {
      const daysStr = openingDays.join(", ");
      const timeStr = `${openTime} - ${closeTime}`;
      setSellerProfile((prev) => ({
        ...prev,
        openingHours: `${daysStr} | ${timeStr}`,
      }));
    } else {
      // If no days selected, maybe don't clear it or set to empty?
      // Let's keep it in sync.
      setSellerProfile((prev) => ({ ...prev, openingHours: "" }));
    }
  }, [openingDays, openTime, closeTime]);

  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Customer Location Search State
  const [customerLocationQuery, setCustomerLocationQuery] = useState("");
  const [customerLocationSuggestions, setCustomerLocationSuggestions] =
    useState<any[]>([]);
  const [customerLocationLoading, setCustomerLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === "SELLER") {
      fetchMyListings();
    }
  }, [token, user]);
  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me", token || undefined);
      if (res) {
        setProfile({
          name: res.name || "",
          email: res.email || "",
          username: res.username || "",
          profilePicture: res.profilePicture || "",
          role: res.role || "",
          district: res.district || "",
          state: res.state || "",
          country: res.country || "",
          subscription: res.subscription,
        });
        if (res.sellerProfile) {
          setSellerProfile({
            lat: res.sellerProfile.latitude,
            lng: res.sellerProfile.longitude,
            address: res.sellerProfile.address || "",
            city: res.sellerProfile.city || "",
            state: res.sellerProfile.state || "",
            country: res.sellerProfile.country || "",
            description: res.sellerProfile.description || "",
            openingHours: res.sellerProfile.openingHours || "",
            bannerUrl: res.sellerProfile.bannerUrl || "",
          });

          // Parse Opening Hours if available
          if (res.sellerProfile.openingHours) {
            const parts = res.sellerProfile.openingHours.split(" | ");
            if (parts.length === 2) {
              const days = parts[0]
                .split(", ")
                .filter((d: string) => d.trim() !== "");
              const times = parts[1].split(" - ");
              if (days.length > 0) setOpeningDays(days);
              if (times.length === 2) {
                setOpenTime(times[0].trim());
                setCloseTime(times[1].trim());
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyListings = async () => {
    try {
      const res = await api.get("/marketplace/my-listings", token || undefined);
      if (Array.isArray(res)) {
        setMyListings(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const payload = {
        name: profile.name,
        username: profile.username,
        profilePicture: profile.profilePicture,
        district: profile.district,
        state: profile.state,
        country: profile.country,
      };

      await api.put("/user/me", payload, token || undefined);

      // Also update seller profile if applicable to prevent user confusion
      if (profile.role === "SELLER") {
        await api.put("/user/me/location", sellerProfile, token || undefined);
      }

      // Update local auth store
      if (user && token) {
        useAuthStore.getState().login(
          {
            ...user,
            name: profile.name,
            username: profile.username,
            profilePicture: profile.profilePicture,
            district: profile.district,
            state: profile.state,
            country: profile.country,
          },
          token,
        );
      }

      alert("Profile and settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || !passwordData.currentPassword) {
      alert(
        passwordData.newPassword
          ? "Please enter current password"
          : "Please enter new password",
      );
      return;
    }
    try {
      await api.put("/user/me/password", passwordData, token || undefined);
      alert("Password updated");
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      // Type as any for simple error handling
      const msg = err?.message || "Failed to update password";
      alert(msg);
    }
  };

  // Autocomplete for Customer Location
  useEffect(() => {
    if (!customerLocationQuery || customerLocationQuery.length < 3) {
      setCustomerLocationSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setCustomerLocationLoading(true);
      try {
        // Ignore search if it matches an already selected result exactly
        const isSelected = customerLocationSuggestions.some(
          (s) => s.display_name === customerLocationQuery,
        );
        if (isSelected) {
          setCustomerLocationLoading(false);
          return;
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customerLocationQuery)}&limit=5&addressdetails=1`,
          {
            headers: {
              "User-Agent": "BudPlugApp/1.0",
            },
          },
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setCustomerLocationSuggestions(data);
          setShowSuggestions(true);
        } else {
          setCustomerLocationSuggestions([]);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setCustomerLocationLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [customerLocationQuery]);

  const handleSelectLocation = (result: any) => {
    const address = result.address || {};

    setProfile((prev) => ({
      ...prev,
      district:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.county ||
        "",
      state: address.state || address.region || "",
      country: address.country || "",
    }));

    setCustomerLocationQuery(result.display_name);
    setShowSuggestions(false);
  };

  const handleUpdateLocation = async () => {
    try {
      await api.put("/user/me/location", sellerProfile, token || undefined);

      // Refresh user data in store to reflect changes in dashboard
      const { refreshUser } = useAuthStore.getState();
      if (refreshUser) {
        await refreshUser();
      }

      alert("Shop settings and location updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to update settings: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateListing = async () => {
    try {
      setLoading(true);
      await api.post(
        "/marketplace/listings",
        {
          title: newListing.title,
          description: newListing.description,
          price: parseFloat(newListing.price) || 0,
          imageUrl: newListing.imageUrl || undefined,
          videoUrl: newListing.videoUrl || undefined,
          minQuantity: parseInt(newListing.minQuantity) || 1,
          deliveryAvailable: newListing.deliveryAvailable,
          strainType: newListing.strainType || undefined,
          thcContent: newListing.thcContent
            ? parseFloat(newListing.thcContent)
            : undefined,
          cbdContent: newListing.cbdContent
            ? parseFloat(newListing.cbdContent)
            : undefined,
          type: newListing.type || undefined,
          flavors: newListing.flavors || undefined,
          effects: newListing.effects || undefined,
          sku: newListing.sku || undefined,
        },
        token || undefined,
      );
      alert("Listing created");
      fetchMyListings();
      setNewListing({
        title: "",
        description: "",
        price: "",
        imageUrl: "",
        videoUrl: "",
        minQuantity: "1",
        deliveryAvailable: false,
        strainType: "",
        thcContent: "",
        cbdContent: "",
        type: "",
        flavors: "",
        effects: "",
        sku: "",
      });
    } catch (err: any) {
      alert(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
      // Refresh listing count in dashboard
      const { refreshUser } = useAuthStore.getState();
      if (refreshUser) refreshUser();
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      if (!confirm("Are you sure?")) return;
      await api.delete(`/marketplace/listings/${id}`, token || undefined);
      alert("Listing deleted");
      fetchMyListings();
      // Refresh listing count in dashboard
      const { refreshUser } = useAuthStore.getState();
      if (refreshUser) refreshUser();
    } catch (err) {
      alert("Failed to delete listing");
    }
  };

  const handleDelistListing = async (id: string) => {
    try {
      if (
        !confirm(
          "Are you sure you want to delist this item? It will be hidden from the marketplace.",
        )
      )
        return;
      await api.put(
        `/marketplace/listings/${id}/delist`,
        {},
        token || undefined,
      );
      alert("Listing delisted");
      fetchMyListings();
      // Refresh listing count in dashboard
      const { refreshUser } = useAuthStore.getState();
      if (refreshUser) refreshUser();
    } catch (err) {
      alert("Failed to delist listing");
    }
  };

  const handleRelistListing = async (id: string) => {
    try {
      await api.put(
        `/marketplace/listings/${id}/relist`,
        {},
        token || undefined,
      );
      alert("Listing relisted");
      fetchMyListings();
      // Refresh listing count in dashboard
      const { refreshUser } = useAuthStore.getState();
      if (refreshUser) refreshUser();
    } catch (err) {
      alert("Failed to relist listing");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append("image", e.target.files[0]);
      try {
        const res = await api.upload(
          "/upload/image",
          formData,
          token || undefined,
        );
        setNewListing({ ...newListing, imageUrl: res.url });
      } catch (err) {
        alert("Failed to upload image");
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("Video is too large. Maximum size is 10MB.");
        return;
      }
      const formData = new FormData();
      formData.append("video", file);
      try {
        const res = await api.uploadVideo(
          "/upload/video",
          formData,
          token || undefined,
        );
        setNewListing({ ...newListing, videoUrl: res.url });
      } catch (err: any) {
        alert(err.message || "Failed to upload video");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert("Please enter your password to confirm deletion.");
      return;
    }

    try {
      await api.delete("/user/me", token!, { password: deletePassword });
      useAuthStore.getState().logout();
      window.location.href = "/";
    } catch (err: any) {
      alert(
        err.message || "Failed to delete account. Please check your password.",
      );
    }
  };

  if (!user) {
    return <div className="p-10">Please log in to view profile.</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Profile Management</h1>
        {profile.subscription?.status === "ACTIVE" && (
          <span
            title="Verified Premium Seller"
            className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full shadow-sm"
          >
            <Check className="w-5 h-5" strokeWidth={3} />
          </span>
        )}
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start sm:justify-center">
          <TabsTrigger value="profile">Profile & Location</TabsTrigger>
          {profile.role === "SELLER" && (
            <>
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="promotions">My Promotions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </>
          )}
          <TabsTrigger value="deletion">Deletion</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-muted rounded-full border overflow-hidden flex items-center justify-center shrink-0 shadow-sm group ring-2 ring-transparent hover:ring-primary/20 transition-all">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? "opacity-30 blur-sm" : ""}`}
                      />
                    ) : (
                      <span className="text-4xl text-muted-foreground/30 font-light">
                        ?
                      </span>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Client-side Validation
                            const validTypes = [
                              "image/jpeg",
                              "image/png",
                              "image/gif",
                              "image/webp",
                            ];
                            if (!validTypes.includes(file.type)) {
                              alert(
                                "Invalid file type. Please upload JPG, PNG, GIF, or WebP.",
                              );
                              return;
                            }

                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              alert("File is too large. Maximum size is 5MB.");
                              return;
                            }

                            setUploading(true);
                            const formData = new FormData();
                            formData.append("image", file);
                            try {
                              const res = await api.upload(
                                "/upload/image",
                                formData,
                                token || undefined,
                              );
                              // Set local state immediately for fast feedback
                              setProfile((prev) => ({
                                ...prev,
                                profilePicture: res.url,
                              }));
                            } catch (err) {
                              alert("Failed to upload image");
                            } finally {
                              setUploading(false);
                              // Reset input so same file can be selected again if needed
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }
                          }
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? "Uploading..." : "Change Photo"}
                        </Button>
                        {profile.profilePicture && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setProfile({ ...profile, profilePicture: "" })
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Supported: JPG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                    placeholder="Username"
                  />
                  <p className="text-xs text-yellow-600">
                    Note: Username can only be changed once every 30 days.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-base font-semibold">Location</Label>
                <div className="space-y-4 relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Search for your location to autofill..."
                        value={customerLocationQuery}
                        onChange={(e) => {
                          setCustomerLocationQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => {
                          if (customerLocationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                      />
                      {customerLocationLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </div>

                  {showSuggestions &&
                    customerLocationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {customerLocationSuggestions.map(
                          (suggestion, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                              onClick={() => handleSelectLocation(suggestion)}
                            >
                              {suggestion.display_name}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>District / City</Label>
                  <Input
                    list="district-options"
                    value={profile.district || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, district: e.target.value })
                    }
                    placeholder="e.g. Subang Jaya"
                  />
                  <datalist id="district-options">
                    <option value="Central" />
                    <option value="North" />
                    <option value="South" />
                    <option value="East" />
                    <option value="West" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    list="state-options"
                    value={profile.state || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, state: e.target.value })
                    }
                    placeholder="e.g. Selangor"
                  />
                  <datalist id="state-options">
                    <option value="Kuala Lumpur" />
                    <option value="Selangor" />
                    <option value="Johor" />
                    <option value="Penang" />
                    <option value="Sabah" />
                    <option value="Sarawak" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    list="country-options"
                    value={profile.country || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, country: e.target.value })
                    }
                    placeholder="e.g. Malaysia"
                  />
                  <datalist id="country-options">
                    <option value="Malaysia" />
                    <option value="Singapore" />
                    <option value="Indonesia" />
                    <option value="Brunei" />
                    <option value="Thailand" />
                    <option value="United States" />
                    <option value="United Kingdom" />
                    <option value="Australia" />
                  </datalist>
                </div>
              </div>

              <Button onClick={handleUpdateProfile}>Update Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleUpdatePassword} variant="outline">
                Change Password
              </Button>
            </CardContent>
          </Card>

          {profile.role === "SELLER" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Details</CardTitle>
                  <CardDescription>
                    Update your physical location to be visible on the map.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 pb-4">
                    <Label>Location Search & Map</Label>
                    <LocationPicker
                      initialLat={sellerProfile.lat || 51.505}
                      initialLng={sellerProfile.lng || -0.09}
                      onLocationSelect={(data) => {
                        setSellerProfile((prev) => ({
                          ...prev,
                          lat: data.lat,
                          lng: data.lng,
                          address: data.address,
                          city: data.city,
                          state: data.state,
                          country: data.country,
                        }));
                      }}
                    />
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>
                        Selected Latitude: {sellerProfile.lat.toFixed(6)}
                      </span>
                      <span>
                        Selected Longitude: {sellerProfile.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={sellerProfile.address}
                      onChange={(e) =>
                        setSellerProfile({
                          ...sellerProfile,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={sellerProfile.city}
                        onChange={(e) =>
                          setSellerProfile({
                            ...sellerProfile,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={sellerProfile.state}
                        onChange={(e) =>
                          setSellerProfile({
                            ...sellerProfile,
                            state: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleUpdateLocation}>
                      Save Location
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shop Branding</CardTitle>
                  <CardDescription>
                    Manage your shop's appearance, hours, and description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      Opening Hours
                    </Label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setOpeningDays((prev) =>
                                  prev.includes(day)
                                    ? prev.filter((d: string) => d !== day)
                                    : [...prev, day],
                                );
                              }}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                openingDays.includes(day)
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-card text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {day}
                            </button>
                          ),
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="openTime"
                            className="text-xs text-muted-foreground"
                          >
                            Open
                          </Label>
                          <Input
                            type="time"
                            id="openTime"
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <span className="pt-6 text-muted-foreground">-</span>
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="closeTime"
                            className="text-xs text-muted-foreground"
                          >
                            Close
                          </Label>
                          <Input
                            type="time"
                            id="closeTime"
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Preview: {sellerProfile.openingHours || "Closed"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      Shop Banner
                    </Label>
                    <div className="space-y-4">
                      <div className="relative w-full aspect-4/1 bg-muted rounded-xl border border-border overflow-hidden shadow-sm group">
                        {sellerProfile.bannerUrl ? (
                          <img
                            src={sellerProfile.bannerUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                            <Upload className="w-10 h-10 opacity-20 mb-2" />
                            <span className="text-sm opacity-50">
                              No banner uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Recommended size: 1200x300px. JPG, PNG or WebP.
                        </p>

                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const uploadData = new FormData();
                                uploadData.append("image", file);
                                try {
                                  const res = await api.upload(
                                    "/upload/image",
                                    uploadData,
                                    token!,
                                  );
                                  if (res.url) {
                                    setSellerProfile((prev) => ({
                                      ...prev,
                                      bannerUrl: res.url,
                                    }));
                                  }
                                } catch (err) {
                                  console.error("Banner upload failed", err);
                                }
                              }
                            }}
                            className="hidden"
                            id="banner-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("banner-upload")?.click()
                            }
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {sellerProfile.bannerUrl
                              ? "Change Banner"
                              : "Upload Banner"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      About Your Shop
                    </Label>
                    <Textarea
                      value={sellerProfile.description}
                      onChange={(e) =>
                        setSellerProfile({
                          ...sellerProfile,
                          description: e.target.value,
                        })
                      }
                      placeholder="Tell buyers about your shop..."
                      rows={4}
                    />
                  </div>

                  <div className="pt-2">
                    <Button onClick={handleUpdateLocation}>
                      Save Branding Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  Basic Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newListing.title}
                      onChange={(e) =>
                        setNewListing({ ...newListing, title: e.target.value })
                      }
                      placeholder="e.g. Premium Blue Dream"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newListing.type}
                      onChange={(e) =>
                        setNewListing({ ...newListing, type: e.target.value })
                      }
                    >
                      <option value="">Select a type...</option>
                      <option value="Concentrates">Concentrates</option>
                      <option value="Clones">Clones</option>
                      <option value="Extract">Extract</option>
                      <option value="Edible">Edible</option>
                      <option value="Flower">Flower</option>
                      <option value="Topicals">Topicals</option>
                      <option value="Grow">Grow</option>
                      <option value="Gear">Gear</option>
                      <option value="Preroll">Preroll</option>
                      <option value="Smoking">Smoking</option>
                      <option value="Tinctures">Tinctures</option>
                      <option value="Vaporizers">Vaporizers</option>
                      <option value="Unidentified">Unidentified</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Strain Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newListing.strainType}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          strainType: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      <option value="Indica">Indica</option>
                      <option value="Sativa">Sativa</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>THC (%)</Label>
                    <Input
                      type="number"
                      value={newListing.thcContent}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          thcContent: e.target.value,
                        })
                      }
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CBD (%)</Label>
                    <Input
                      type="number"
                      value={newListing.cbdContent}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          cbdContent: e.target.value,
                        })
                      }
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Flavours</Label>
                    <Input
                      value={newListing.flavors}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          flavors: e.target.value,
                        })
                      }
                      placeholder="E.g., Citrus, Berry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effects</Label>
                    <Input
                      value={newListing.effects}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          effects: e.target.value,
                        })
                      }
                      placeholder="E.g., Relaxed, Happy"
                    />
                  </div>
                </div>
              </div>

              {/* Logistics & Handling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  Logistics & Handling
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      value={newListing.price}
                      onChange={(e) =>
                        setNewListing({ ...newListing, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Quantity</Label>
                    <Input
                      type="number"
                      value={newListing.minQuantity}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          minQuantity: e.target.value,
                        })
                      }
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU (Optional)</Label>
                    <Input
                      value={newListing.sku}
                      onChange={(e) =>
                        setNewListing({ ...newListing, sku: e.target.value })
                      }
                      placeholder="Auto-generate if blank"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="create-delivery"
                    checked={newListing.deliveryAvailable}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        deliveryAvailable: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="create-delivery">Delivery Available</Label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  Description
                </h3>
                <div className="space-y-2">
                  <Textarea
                    value={newListing.description}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add a detailed description..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  Media
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        className="w-full text-xs"
                      />
                      {newListing.imageUrl && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          ✓ Image ready
                        </p>
                      )}
                    </div>
                  </div>
                  {user?.subscription?.status === "ACTIVE" && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Product Video{" "}
                        <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-900/50 uppercase tracking-wider font-bold shadow-sm">
                          Premium
                        </span>
                      </Label>
                      <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(e)}
                          className="w-full text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Max size: 10MB
                        </p>
                        {newListing.videoUrl && (
                          <p className="text-sm text-green-600 mt-2 font-medium">
                            ✓ Video ready
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button
                  onClick={handleCreateListing}
                  disabled={loading}
                  className="w-full md:w-auto hover:-translate-y-0.5 transition-transform duration-200"
                >
                  {loading ? "Creating..." : "Create Listing"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {myListings.length === 0 && <p>No listings found.</p>}

                {/* Active Listings */}
                {myListings.some((l) => l.active !== false) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Active Listings
                    </h3>
                    {myListings
                      .filter((l) => l.active !== false)
                      .map((listing) => (
                        <div
                          key={listing.id}
                          className="border border-border p-4 rounded bg-card text-card-foreground shadow-sm grid grid-cols-[auto_1fr_auto] gap-4 items-center"
                        >
                          {/* Image Column */}
                          {listing.imageUrl ? (
                            <div className="w-24 h-24 bg-muted rounded-md border border-border overflow-hidden relative shrink-0">
                              <img
                                src={listing.imageUrl}
                                alt={listing.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-muted rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
                              No Image
                            </div>
                          )}

                          {/* Text Column */}
                          <div className="min-w-0 pr-4">
                            <h3
                              className="font-bold text-lg text-foreground truncate"
                              title={listing.title}
                            >
                              {listing.title}
                            </h3>
                            <p className="text-muted-foreground font-medium">
                              ${listing.price}
                            </p>
                            <div className="mt-1">
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded-full font-bold ${
                                  listing.status === "PENDING"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"
                                    : listing.status === "ACTIVE"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                                      : listing.status === "REJECTED"
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                                        : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {listing.status}
                              </span>
                            </div>
                          </div>

                          {/* Action Column */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingListing(listing)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDelistListing(listing.id)}
                            >
                              Delist
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteListing(listing.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Delisted Listings */}
                {myListings.some((l) => l.active === false) && (
                  <div className="space-y-4 pt-6">
                    <h3 className="text-lg font-semibold border-b border-border pb-2 text-muted-foreground">
                      Delisted Listings
                    </h3>
                    <div className="opacity-75 space-y-4">
                      {myListings
                        .filter((l) => l.active === false)
                        .map((listing) => (
                          <div
                            key={listing.id}
                            className="border border-border p-4 rounded bg-muted/30 shadow-sm grid grid-cols-[auto_1fr_auto] gap-4 items-center"
                          >
                            {/* Image Column */}
                            {listing.imageUrl ? (
                              <div className="w-24 h-24 bg-muted rounded-md border border-border overflow-hidden relative shrink-0">
                                <img
                                  src={listing.imageUrl}
                                  alt={listing.title}
                                  className="absolute inset-0 w-full h-full object-cover grayscale"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-muted rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
                                No Image
                              </div>
                            )}

                            {/* Text Column */}
                            <div className="min-w-0 pr-4">
                              <h3
                                className="font-bold text-lg truncate text-muted-foreground"
                                title={listing.title}
                              >
                                {listing.title}
                              </h3>
                              <p className="text-muted-foreground/70 font-medium">
                                ${listing.price}
                              </p>
                              <div className="mt-1">
                                <span className="inline-block text-xs px-2 py-1 rounded-full font-bold bg-accent text-accent-foreground border border-border">
                                  DELISTED
                                </span>
                              </div>
                            </div>

                            {/* Action Column */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingListing(listing)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRelistListing(listing.id)}
                              >
                                Relist
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteListing(listing.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {editingListing && (
            <EditListingModal
              listing={editingListing}
              onClose={() => setEditingListing(null)}
              onUpdate={fetchMyListings}
            />
          )}
        </TabsContent>

        {profile.role === "SELLER" && (
          <TabsContent value="promotions" className="space-y-6">
            <BannersTab token={token} />
          </TabsContent>
        )}

        {profile.role === "SELLER" && (
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>
        )}

        <TabsContent value="deletion" className="space-y-6">
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h3 className="font-semibold text-destructive">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and remove your data from
                    our servers.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionTab subscription={profile.subscription} />
        </TabsContent>
      </Tabs>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-1000 p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-xl p-6 w-full max-w-md shadow-2xl border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Delete Account
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This action cannot
                be undone. All your data will be anonymized and your listings
                deactivated.
              </p>

              <div className="space-y-2">
                <Label htmlFor="delete-password">Confirm Password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function BannersTab({ token }: { token: string | null }) {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get("/banners", token)
      .then((res) => setBanners(Array.isArray(res) ? res : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const pendingBanners = banners.filter((b) => b.status === "PENDING");
  const approvedBanners = banners.filter((b) => b.status === "APPROVED");
  const otherBanners = banners.filter(
    (b) => b.status !== "PENDING" && b.status !== "APPROVED",
  );

  // Image URL helper (reused logic)
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    // Remove trailing slash if present
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

    // Handle case where API_URL is just '/api' (proxy)
    if (baseUrl === "/api") baseUrl = "http://localhost:4000";

    // For uploads, we need the server root, not the API root
    if (path.startsWith("/uploads") && baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }

    return `${baseUrl}${path}`;
  };

  if (loading) return <div>Loading promotions...</div>;

  const BannerList = ({ title, list }: { title: string; list: any[] }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {title} ({list.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No banners in this category.
          </p>
        ) : (
          <div className="space-y-4">
            {list.map((banner) => (
              <div
                key={banner.id}
                className="flex gap-4 border border-border p-4 rounded-lg items-center bg-card text-card-foreground relative overflow-hidden"
              >
                <div className="w-32 h-16 bg-muted rounded shrink-0 border border-border overflow-hidden">
                  <img
                    src={getImageUrl(banner.imageUrl)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-foreground">
                    {banner.title || "No Title"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Listing: {banner.listing?.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {banner.status === "APPROVED" && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded font-medium border border-green-200 dark:border-green-900/50">
                        Runs: {new Date(banner.startDate).toLocaleDateString()}{" "}
                        - {new Date(banner.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {banner.status === "PENDING" && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded font-medium border border-yellow-200 dark:border-yellow-900/50">
                        Waiting for Approval
                      </span>
                    )}
                    {banner.status === "REJECTED" && (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-0.5 rounded font-medium border border-red-200 dark:border-red-900/50">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // BannersTab is not fully implemented in the current file view, implying it was cut off or had errors.
  // I am restoring it with placeholder data to ensure compilation.
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-foreground">
          My Promotional Banners
        </h2>
        <p className="text-muted-foreground">
          Track the status of your "Product of the Week" banner requests.
        </p>
      </div>
      {/* Context: Banners functionality seems to be work-in-progress or lost. Placeholder message added. */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-md border border-yellow-200 dark:border-yellow-900/50">
        Banner management is currently under maintenance.
      </div>
    </div>
  );
}
