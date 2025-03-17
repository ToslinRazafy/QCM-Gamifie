"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import { ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";

export default function Register() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    pseudo: "",
    email: "",
    password: "",
    country: "",
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Country selection states
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    async function fetchCountries() {
      const res = await fetch("https://restcountries.com/v3.1/all");
      const data = await res.json();

      const countryList = data
        .map((country) => ({
          name: country.name.common,
          flag: country.flags.svg,
          code: country.cca2,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCountries(countryList);
    }
    fetchCountries();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        country: selectedCountry?.code || "",
      };
      await api.post("/register", submitData);
      setStep("verify");
    } catch (err: any) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(", ")
          : "An error occurred during registration"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/verify-otp", {
        ...formData,
        code,
      });
      const { token } = response.data;
      localStorage.setItem("token", token);
      router.push("/platform");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === "register" ? "Register" : "Verify Your Email"}
            </CardTitle>
            <CardDescription>
              {step === "register"
                ? "Create your account to get started"
                : "Enter the verification code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Previous input fields remain the same */}
                <div className="grid gap-2">
                  <Label htmlFor="firstname">Nom</Label>
                  <Input
                    id="firstname"
                    type="text"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Prenom (Optional)</Label>
                  <Input
                    id="lastname"
                    type="text"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="transition-all duration-300"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pseudo">Pseudo</Label>
                  <Input
                    id="pseudo"
                    type="text"
                    value={formData.pseudo}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">
                    Confirmer votre mot de passe
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    disabled={loading}
                    required
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Country (Optional)</Label>
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
                                  setFormData({
                                    ...formData,
                                    country: country.code,
                                  });
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                    required
                    maxLength={6}
                    className={cn(
                      "transition-all duration-300",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline underline-offset-4"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
