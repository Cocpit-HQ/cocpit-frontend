import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventCard } from '@/types/event';
import { useEvents } from '@/context/EventsContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getProfile } from '@/services/api/profile';
import TicketCard from './TicketCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventCard | undefined;
  isDark?: boolean;
}

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid mobile number (min 10 digits)"),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const EventRegistrationModal = ({
  isOpen,
  onClose,
  event,
}: EventRegistrationModalProps) => {
  const { registerForEvent } = useEvents();
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingProfile(true);
      getProfile()
        .then(data => {
          form.reset({
            name: data.user.name || '',
            email: data.user.email || '',
            mobile: data.user.mobile_number || '',
          });
        })
        .catch(err => console.error("Failed to fetch profile for event registration", err))
        .finally(() => setIsLoadingProfile(false));
    }
  }, [isOpen, form]);

  if (!event) return null;

  const isPremium = event.price != null && event.price > 0;

  const handlePayment = () => {
    // Mock payment
    setTimeout(() => {
      setIsPaymentDone(true);
    }, 1000);
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (isPremium && !isPaymentDone) {
      setRegisterError("Please complete payment first.");
      return;
    }

    setRegisterError(null);
    const result = await registerForEvent(event.id, {
      name: values.name,
      email: values.email,
      mobile_number: values.mobile,
    });

    if (result.success) {
      setIsRegistered(true);
      if ((result as any).ticket) {
        setTicket((result as any).ticket);
      }
      form.reset();
    } else {
      const err: any = result.error;
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to register.";
      setRegisterError(msg);
    }
  };

  const handleCloseAndRedirect = () => {
    onClose();
    setIsRegistered(false);
    setIsPaymentDone(false);
    setRegisterError(null);
    setTicket(null);
    form.reset();
  };

  const downloadTicket = async () => {
    const element = document.getElementById("ticket");
    if (!element) return;

    const originalColorScheme = document.body.style.colorScheme;
    document.body.style.colorScheme = "light";

    const canvas = await html2canvas(element, { 
      scale: 2,
      backgroundColor: "#ffffff"
    });

    document.body.style.colorScheme = originalColorScheme;

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // A4 width is 210mm. Let's make the ticket 100mm wide
    const pdfWidth = 100;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", (210 - pdfWidth) / 2, 20, pdfWidth, pdfHeight);
    pdf.save(`ticket-${event?.title.substring(0, 10).replace(/\s/g, '') || 'event'}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseAndRedirect();
    }}>
      <DialogContent className="bg-card border-border sm:max-w-[425px] max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isRegistered ? 'Registration Successful' : `Register for ${event.title}`}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1.5 font-normal">
            {!isRegistered ? "Secure your spot in seconds 🚀" : "Your registration was successful."}
          </DialogDescription>
        </DialogHeader>

        {isRegistered ? (
          <div className="flex flex-col items-center py-4 w-full">
            <p className="text-muted-foreground text-center mb-2">
              You have successfully registered for <strong>{event.title}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              A confirmation email has been sent to {form.getValues().email}.
            </p>
            
            {ticket && (
              <div className="w-full flex justify-center mb-6">
                <TicketCard ticket={ticket} />
              </div>
            )}
            
            <div className="mt-2 flex w-full max-w-[380px] gap-3">
              {ticket && (
                <Button type="button" variant="outline" className="flex-1" onClick={downloadTicket}>
                  Download Ticket
                </Button>
              )}
              <Button type="button" className="flex-1" onClick={handleCloseAndRedirect}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            {registerError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm mb-2">
                {registerError}
              </div>
            )}

            {isLoadingProfile && (
              <div className="text-xs text-muted-foreground text-center">Loading your details...</div>
            )}



            <div className="grid gap-2">
              <Label htmlFor="name" className="text-left text-foreground">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Your Name"
                readOnly
                className="bg-muted cursor-not-allowed opacity-70 border-border text-foreground"
              />
              {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-left text-foreground">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Your Email"
                readOnly
                className="bg-muted cursor-not-allowed opacity-70 border-border text-foreground"
              />
              {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mobile" className="text-left text-foreground">Mobile *</Label>
              <Input
                id="mobile"
                type="tel"
                {...form.register("mobile")}
                placeholder="+1234567890"
                className="bg-input border-border text-foreground"
              />
              {form.formState.errors.mobile && <p className="text-red-500 text-xs">{form.formState.errors.mobile.message}</p>}
            </div>

            <p className="text-xs text-muted-foreground -mt-2">
              We’ll only use this to contact you about the event.
            </p>

            {isPremium && (
              <div className="col-span-1 mt-2">
                <div className="rounded-md border p-4 bg-muted border-border">
                  <p className="text-center font-semibold text-foreground">Premium Event</p>
                  <p className="text-center text-lg font-bold text-foreground">Price: ${event.price}</p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      className={`w-full ${isPaymentDone ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                      onClick={handlePayment}
                      disabled={isPaymentDone}
                    >
                      {isPaymentDone ? 'Payment Done' : 'Proceed to Payment'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="secondary" onClick={handleCloseAndRedirect}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.watch('name') || !form.watch('email') || !form.watch('mobile') || form.formState.isSubmitting || (isPremium && !isPaymentDone)}
              >
                {form.formState.isSubmitting ? "Confirming..." : "Confirm Registration"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
