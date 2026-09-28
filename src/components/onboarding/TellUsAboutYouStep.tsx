// [CLEANUP:DEAD_FILE] Legacy profile/onboarding component is orphaned and unused.
// "use client";
// 
// import { useState } from "react";
// import { Loader2, ChevronLeft } from "lucide-react";
// import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
// import { LocationSuggestion, StructuredLocation } from "@/services/api/location";
// import { updateOnboardingLocation } from "@/services/api/onboarding";
// import { reverseGeocode } from "@/services/api/location";
// import { useToast } from "@/hooks/use-toast";
// import { useOnboardingStore } from "@/store/onboarding.store";
// import { useMemo } from "react";
// import styles from "./TellUsAboutYouStep.module.css";
// 
// interface TellUsAboutYouStepProps {
//   onNext: () => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }
// 
// export default function TellUsAboutYouStep({ onNext, onBack, currentStep, totalSteps }: TellUsAboutYouStepProps) {
//   const { 
//     locationPlaceId, locationFormatted, locationCountry, locationState, 
//     locationCity, locationLat, locationLng, setLocation 
//   } = useOnboardingStore();
//   const [submitting, setSubmitting] = useState(false);
//   const [detecting, setDetecting] = useState(false);
//   const { toast } = useToast();
// 
//   const selectedLocation = useMemo((): StructuredLocation | null => {
//     if (!locationPlaceId || !locationFormatted) return null;
//     return { 
//       placeId: locationPlaceId, 
//       formattedAddress: locationFormatted,
//       country: locationCountry || "",
//       state: locationState,
//       city: locationCity || "",
//       latitude: locationLat,
//       longitude: locationLng
//     };
//   }, [locationPlaceId, locationFormatted, locationCountry, locationState, locationCity, locationLat, locationLng]);
// 
//   const setSelectedLocation = (loc: LocationSuggestion | StructuredLocation | string | null) => {
//     if (typeof loc === "string") return; // Onboarding requires a structured location
//     setLocation(loc);
//   };
// 
//   const handleContinue = async () => {
//     if (!selectedLocation) return;
// 
//     setSubmitting(true);
//     try {
//       await updateOnboardingLocation({
//         country: selectedLocation.country,
//         state: selectedLocation.state,
//         city: selectedLocation.city,
//         formattedAddress: selectedLocation.formattedAddress,
//         latitude: selectedLocation.latitude,
//         longitude: selectedLocation.longitude,
//         placeId: selectedLocation.placeId,
//       });
// 
//       onNext();
//     } catch (error) {
//       console.error("Failed to save location:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save your location. Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };
// 
//   const handleUseCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       toast({ title: "Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
//       return;
//     }
// 
//     setDetecting(true);
//     toast({ title: "Detecting Location", description: "Getting your current position..." });
// 
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         try {
//           const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
//           if (result) {
//             setSelectedLocation(result);
//             toast({
//               title: "Location Detected",
//               description: `Successfully found your location: ${result.formattedAddress}`,
//             });
//           } else {
//             toast({ title: "Detection Failed", description: "Could not find a city for your coordinates. Please type it manually.", variant: "destructive" });
//           }
//         } catch (err: any) {
//           if (err.message === "UNSUPPORTED_COUNTRY") {
//             toast({ title: "Unsupported Location", description: "We currently only support India, UAE, and Japan.", variant: "destructive" });
//           } else {
//             toast({ title: "Error", description: "Something went wrong while detecting location.", variant: "destructive" });
//           }
//         } finally {
//           setDetecting(false);
//         }
//       },
//       (error) => {
//         setDetecting(false);
//         toast({ title: "Detection Failed", description: "Could not get your location. Please ensure location permissions are granted.", variant: "destructive" });
//       }
//     );
//   };
// 
//   const isValid = !!selectedLocation;
// 
//   return (
//     <div className={styles.container}>
//       <div className={styles.content}>
//         {/* Header Section */}
//         <div className={styles.headerGroup}>
//           <div className={styles.logoContainer}>
//             <img src="/assets/logo.PNG" alt="Cocpit Logo" height={56} className={styles.logo} />
//           </div>
//           <div className={styles.stepContainer}>
//             <div className={styles.stepHeader}>
//               <span className={styles.stepText}>Step {currentStep} of {totalSteps}</span>
//             </div>
//             <div className={styles.progressBar}>
//               <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
//             </div>
//           </div>
//         </div>
// 
//         {/* Title & Subtitle Group */}
//         <div className={styles.textGroup}>
//           <h1 className={styles.title}>Tell us about you</h1>
//           <p className={styles.subtitle}>This helps personalize your experience</p>
//         </div>
// 
//         {/* Location Form */}
//         <div className={styles.formGroup}>
//           <label className={styles.label}>Location</label>
//           <LocationAutocomplete
//             value={selectedLocation?.formattedAddress || null}
//             onSelect={setSelectedLocation}
//             allowedCountryCodes={["in", "ae", "jp"]}
//           />
//           <button
//             type="button"
//             className={styles.useLocationBtn}
//             onClick={handleUseCurrentLocation}
//             disabled={detecting}
//           >
//             {detecting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
//             Use current location
//           </button>
//         </div>
// 
//         {/* Actions */}
//         <div className={styles.actionRow}>
//           <button
//             type="button"
//             className={styles.backButton}
//             onClick={onBack}
//             disabled={submitting}
//           >
//             <ChevronLeft className="w-5 h-5" />
//           </button>
//           <button
//             type="button"
//             className={styles.continueButton}
//             onClick={handleContinue}
//             disabled={!isValid || submitting}
//           >
//             {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continue"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// 