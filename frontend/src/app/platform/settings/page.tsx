"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Ajout du composant Textarea
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from "@/lib/api";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronsUpDown, Check, ArrowLeft, Upload } from "lucide-react";
import Image from "next/image";
import { URL_IMG_BACKEND } from "@/constant";

interface Country {
  name: string;
  flag: string;
  code: string;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour les formulaires et la vue
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    pseudo: "",
    email: "",
    bio: "",
    country: "",
    avatar: null as File | null,
  });
  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<string | null>(null);

  // Charger les données initiales de l'utilisateur et les pays
  useEffect(() => {
    if (!authLoading && user) {
      setProfile({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        pseudo: user.pseudo || "",
        email: user.email || "",
        bio: user.bio || "",
        country: user.country || "",
        avatar: null,
      });
      if (user.country && countries.length > 0) {
        const country = countries.find((c) => c.code === user.country);
        setSelectedCountry(country || null);
      }
    } else if (!authLoading && !user) {
      router.push("/login");
    }

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
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(countryList);
      } catch (err) {
        console.error("Erreur lors de la récupération des pays:", err);
        toast.error("Impossible de charger la liste des pays");
      }
    }
    fetchCountries();
  }, [authLoading, user, router]);

  // Gestion des changements dans le formulaire de profil
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile((prev) => ({ ...prev, avatar: file }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setProfile((prev) => ({ ...prev, avatar: file }));
    } else {
      toast.error("Veuillez déposer une image valide");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire de profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen("profile");
  };

  const confirmProfileSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstname", profile.firstname);
      formData.append("lastname", profile.lastname);
      formData.append("pseudo", profile.pseudo);
      formData.append("email", profile.email);
      formData.append("bio", profile.bio);
      formData.append("country", selectedCountry?.code || profile.country);
      if (profile.avatar) {
        formData.append("avatar", profile.avatar);
      }

      const response = await api.post("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message);
      setActiveSection(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Erreur lors de la mise à jour du profil";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setConfirmOpen(null);
    }
  };

  // Soumission du formulaire de mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen("password");
  };

  const confirmPasswordSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.patch("/profile/password", password);
      toast.success(response.data.message);
      setPassword({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setActiveSection(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Erreur lors de la mise à jour du mot de passe";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setConfirmOpen(null);
    }
  };

  // Activer/Désactiver le compte
  const handleToggleActive = async () => {
    setConfirmOpen("toggle");
  };

  const confirmToggleActive = async () => {
    setLoading(true);
    try {
      const response = await api.patch("/profile/toggle-active");
      toast.success(
        `Compte ${response.data.is_active ? "activé" : "désactivé"} avec succès`
      );
      setActiveSection(null);
    } catch (err: any) {
      toast.error("Erreur lors de la modification de l'état du compte");
    } finally {
      setLoading(false);
      setConfirmOpen(null);
    }
  };

  // Suppression du compte
  const handleDeleteProfile = async () => {
    setConfirmOpen("delete");
  };

  const confirmDeleteProfile = async () => {
    setLoading(true);
    try {
      const response = await api.delete("/profile");
      toast.success(response.data.message);
      logout();
      router.push("/");
    } catch (err: any) {
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setLoading(false);
      setConfirmOpen(null);
    }
  };

  if (authLoading || countries.length === 0) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>

      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Menu à gauche (Desktop) ou plein écran (Mobile) */}
        <div
          className={`md:w-1/4 ${activeSection ? "hidden md:block" : "block"}`}
        >
          <div className="space-y-4">
            <Button
              variant={activeSection === "profile" ? "default" : "outline"}
              className="w-full"
              onClick={() => setActiveSection("profile")}
            >
              Modifier les informations
            </Button>
            <Button
              variant={activeSection === "password" ? "default" : "outline"}
              className="w-full"
              onClick={() => setActiveSection("password")}
            >
              Modifier le mot de passe
            </Button>
            <Button
              variant={activeSection === "toggle" ? "default" : "outline"}
              className="w-full"
              onClick={() => setActiveSection("toggle")}
            >
              {user?.is_active ? "Désactiver le compte" : "Activer le compte"}
            </Button>
            <Button
              variant={activeSection === "delete" ? "default" : "outline"}
              className="w-full"
              onClick={() => setActiveSection("delete")}
            >
              Supprimer le compte
            </Button>
          </div>
        </div>

        {/* Contenu à droite (Desktop) ou plein écran avec retour (Mobile) */}
        <div
          className={`md:w-3/4 ${activeSection ? "block" : "hidden md:block"}`}
        >
          {activeSection && (
            <div className="md:hidden mb-4">
              <Button variant="ghost" onClick={() => setActiveSection(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
            </div>
          )}

          {/* Modifier les informations */}
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Modifier les informations</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className="relative cursor-pointer"
                      onClick={handleAvatarClick}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={
                            profile.avatar
                              ? URL.createObjectURL(profile.avatar)
                              : `${URL_IMG_BACKEND}/${user?.avatar}` ||
                                `https://api.dicebear.com/9.x/initials/svg?seed=${user?.pseudo}`
                          }
                        />
                        <AvatarFallback>{user?.firstname[0]}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full transition-opacity ${
                          isDragging
                            ? "opacity-100"
                            : "opacity-0 hover:opacity-100"
                        }`}
                      >
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div
                      className={`w-full border-2 border-dashed rounded-md p-4 transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/10"
                          : "border-gray-300"
                      } hidden md:block`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Label
                        htmlFor="avatar"
                        className="block text-center text-sm"
                      >
                        Glisser-déposer une image ici ou cliquer pour
                        sélectionner
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <Input
                      id="avatar-mobile"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstname">Prénom</Label>
                      <Input
                        id="firstname"
                        name="firstname"
                        value={profile.firstname}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastname">Nom</Label>
                      <Input
                        id="lastname"
                        name="lastname"
                        value={profile.lastname}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pseudo">Pseudo</Label>
                      <Input
                        id="pseudo"
                        name="pseudo"
                        value={profile.pseudo}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Pays (Optionnel)</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                            disabled={loading}
                          >
                            {selectedCountry ? (
                              <span className="flex items-center">
                                <Image
                                  src={selectedCountry.flag}
                                  alt={selectedCountry.name}
                                  width={24}
                                  height={16}
                                  className="w-6 h-4 mr-2"
                                  unoptimized
                                />
                                {selectedCountry.name}
                              </span>
                            ) : (
                              "Sélectionner un pays..."
                            )}
                            <ChevronsUpDown className="opacity-50 ml-auto" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Rechercher un pays..."
                              className="h-9"
                            />
                            <CommandList className="h-full max-h-[300px] overflow-y-auto">
                              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      setSelectedCountry(country);
                                      setProfile((prev) => ({
                                        ...prev,
                                        country: country.code,
                                      }));
                                      setOpen(false);
                                    }}
                                    className="flex items-center"
                                  >
                                    <Image
                                      src={country.flag}
                                      alt={country.name}
                                      width={24}
                                      height={16}
                                      className="w-6 h-4 mr-2"
                                      unoptimized
                                    />
                                    {country.name}
                                    {selectedCountry?.code === country.code && (
                                      <Check className="ml-auto h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Mise à jour..." : "Mettre à jour le profil"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Modifier le mot de passe */}
          {activeSection === "password" && (
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">
                      Mot de passe actuel
                    </Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      value={password.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_password">Nouveau mot de passe</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={password.new_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_password_confirmation">
                      Confirmer le nouveau mot de passe
                    </Label>
                    <Input
                      id="new_password_confirmation"
                      name="new_password_confirmation"
                      type="password"
                      value={password.new_password_confirmation}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Mise à jour..." : "Changer le mot de passe"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Activer/Désactiver le compte */}
          {activeSection === "toggle" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {user?.is_active
                    ? "Désactiver le compte"
                    : "Activer le compte"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.is_active
                    ? "Désactiver votre compte le rendra temporairement inaccessible."
                    : "Activer votre compte le rendra à nouveau accessible."}
                </p>
                <Button
                  variant={user?.is_active ? "destructive" : "default"}
                  onClick={handleToggleActive}
                  disabled={loading}
                >
                  {loading
                    ? "Modification..."
                    : user?.is_active
                    ? "Désactiver"
                    : "Activer"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Supprimer le compte */}
          {activeSection === "delete" && (
            <Card>
              <CardHeader>
                <CardTitle>Supprimer le compte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cette action est irréversible. Votre compte et toutes ses
                  données seront supprimés.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProfile}
                  disabled={loading}
                >
                  {loading ? "Suppression..." : "Supprimer mon compte"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AlertDialog pour les confirmations */}
      <AlertDialog
        open={confirmOpen === "profile"}
        onOpenChange={() => setConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la mise à jour du profil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir mettre à jour vos informations de profil
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmProfileSubmit}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmOpen === "password"}
        onOpenChange={() => setConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer le changement de mot de passe
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir changer votre mot de passe ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPasswordSubmit}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmOpen === "toggle"}
        onOpenChange={() => setConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer {user?.is_active ? "la désactivation" : "l'activation"}{" "}
              du compte
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir{" "}
              {user?.is_active ? "désactiver" : "activer"} votre compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmOpen === "delete"}
        onOpenChange={() => setConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la suppression du compte
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProfile}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
