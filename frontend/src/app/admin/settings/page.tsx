"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { URL_IMG_BACKEND } from "@/constant";

export default function Settings() {
  const { user } = useAuth();
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    pseudo: "",
    email: "",
    avatar: null as File | null | string,
    bio: "",
    country: "",
    preview: null as string | null,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        pseudo: user.pseudo || "",
        email: user.email || "",
        avatar: null,
        bio: user.bio || "",
        country: user.country || "",
        preview: user.avatar
          ? `${URL_IMG_BACKEND}/${user.avatar}`
          : null,
      });
    }
  }, [user]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all");
        const data = await res.json();
        const countryList = data
          .map((country: any) => ({
            name: country.name.common,
            flag: country.flags.svg,
            code: country.cca2,
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCountries(countryList);
        if (profileData.country) {
          const userCountry = countryList.find(
            (c: any) => c.name === profileData.country
          );
          setSelectedCountry(userCountry);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des pays");
      }
    }
    fetchCountries();
  }, [profileData.country]);

  const handleImageChange = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) {
        // 6MB
        toast.error("L'avatar doit être une image valide de moins de 6MB");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setProfileData((prev) => ({
        ...prev,
        avatar: file,
        preview: previewUrl,
      }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    setProfileData((prev) => ({ ...prev, avatar: null, preview: null }));
    toast.info("Image supprimée");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Utilisateur non identifié");
      return;
    }
    if (!profileData.firstname || !profileData.pseudo || !profileData.email) {
      toast.error(
        "Les champs obligatoires (prénom, pseudo, email) doivent être remplis"
      );
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("firstname", profileData.firstname);
    formData.append("lastname", profileData.lastname || "");
    formData.append("pseudo", profileData.pseudo);
    formData.append("email", profileData.email);
    if (profileData.avatar instanceof File)
      formData.append("avatar", profileData.avatar);
    formData.append("bio", profileData.bio || "");
    formData.append(
      "country",
      selectedCountry ? selectedCountry.name : profileData.country || ""
    );

    try {
      const response = await api.post(`/profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });
      setProfileData((prev) => ({
        ...prev,
        avatar: response.data.user.avatar,
        preview: response.data.user.avatar
          ? `${URL_IMG_BACKEND}/${response.data.user.avatar}`
          : null,
      }));
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Profil mis à jour avec succès !");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erreur lors de la mise à jour";
      const errorDetails = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(", ")
        : "";
      toast.error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/profile/password", passwordData);
      toast.success("Mot de passe mis à jour avec succès !");
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la mise à jour"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowProfileForm(!showProfileForm)}
          className="hover:bg-[hsl(var(--muted))]"
        >
          {showProfileForm ? "Mot de passe" : "Profil"}
        </Button>
      </div>

      {showProfileForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mettre à jour le profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleProfileSubmit} className="grid gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors w-32 h-32 flex items-center justify-center ${
                    isDragging
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                      : "border-[hsl(var(--border))]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {profileData.preview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={profileData.preview}
                        alt="Avatar"
                        layout="fill"
                        className="rounded object-cover w-40 h-20"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={removeImage}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                      <label className="text-xs text-[hsl(var(--muted-foreground))] mt-2 cursor-pointer">
                        Glisser ou{" "}
                        <span className="text-[hsl(var(--primary))]">
                          cliquer
                        </span>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageChange(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Prénom *</Label>
                    <Input
                      value={profileData.firstname}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstname: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={profileData.lastname}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastname: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Pseudo *</Label>
                <Input
                  value={profileData.pseudo}
                  onChange={(e) =>
                    setProfileData({ ...profileData, pseudo: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  placeholder="Courte bio (max 500 caractères)"
                  rows={3}
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Pays</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedCountry ? (
                        <span className="flex items-center gap-2">
                          <Image
                            src={selectedCountry.flag}
                            alt={selectedCountry.name}
                            width={20}
                            height={14}
                          />
                          {selectedCountry.name}
                        </span>
                      ) : profileData.country ? (
                        profileData.country
                      ) : (
                        "Sélectionner un pays"
                      )}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Rechercher..." />
                      <CommandList className="max-h-64 overflow-y-auto">
                        <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country: any) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={() => {
                                setSelectedCountry(country);
                                setProfileData({
                                  ...profileData,
                                  country: country.name,
                                });
                                setOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Image
                                src={country.flag}
                                alt={country.name}
                                width={20}
                                height={14}
                              />
                              {country.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handlePasswordSubmit} className="grid gap-4">
              <div>
                <Label htmlFor="current_password">Mot de passe actuel *</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="new_password">Nouveau mot de passe *</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="new_password_confirmation">Confirmer *</Label>
                <Input
                  id="new_password_confirmation"
                  type="password"
                  value={passwordData.new_password_confirmation}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password_confirmation: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
