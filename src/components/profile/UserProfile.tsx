"use client";

import { useState, useEffect } from "react";
import {
  supabase,
  type UserProfile as TUserProfile,
  type UserAddress,
  type PaymentMethod,
  type Order,
} from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  User,
  MapPin,
  CreditCard,
  Clock,
  Plus,
  Edit,
  Trash2,
  Star,
  Package,
} from "lucide-react";

import { toast } from "sonner";
import LogoutButton from "@/components/LogoutButton";

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

export function UserProfile({ userId, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<TUserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("profile");

  // dialogs / forms
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });

  const [addressForm, setAddressForm] = useState({
    title: "",
    address: "",
    city: "",
    postal_code: "",
    is_default: false,
  });

  useEffect(() => {
    // garante que temos um id antes de buscar
    if (!userId) return;
    void loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadUserData() {
    try {
      setLoading(true);

      // Perfil
      const { data: profileData, error: pErr } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (pErr) throw pErr;

      if (profileData) {
        setProfile(profileData as TUserProfile);
        setProfileForm({
          full_name: profileData.full_name ?? "",
          phone: profileData.phone ?? "",
          email: profileData.email ?? "",
        });
      }

      // Endereços
      const { data: addressesData, error: aErr } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (aErr) throw aErr;
      setAddresses(addressesData ?? []);

      // Métodos de pagamento
      const { data: paymentData, error: payErr } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .




