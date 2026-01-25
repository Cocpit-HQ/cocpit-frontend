import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventCard } from '@/types/event';
import { useEvents } from '@/context/EventsContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
  company: z.string().optional(),
  jobTitle: z.string().optional(),
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

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      company: '',
      jobTitle: '',
    },
  });

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
      company_name: values.company,
      job_title: values.jobTitle,
    });

    if (result.success) {
      setIsRegistered(true);
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
    form.reset();
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
        </DialogHeader>

        {isRegistered ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              You have successfully registered for <strong>{event.title}</strong>.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A confirmation email has been sent to {form.getValues().email}.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => alert("Mock Ticket Download")}>
                Download Ticket
              </Button>
              <Button type="button" onClick={handleCloseAndRedirect}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {registerError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm mb-2">
                {registerError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name" className="text-left text-foreground">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Your Name"
                className="bg-input border-border text-foreground"
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
                className="bg-input border-border text-foreground"
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

            <div className="grid gap-2">
              <Label htmlFor="company" className="text-left text-foreground">Company</Label>
              <Input
                id="company"
                {...form.register("company")}
                placeholder="Your Company"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jobTitle" className="text-left text-foreground">Job Title</Label>
              <Input
                id="jobTitle"
                {...form.register("jobTitle")}
                placeholder="Your Job Title"
                className="bg-input border-border text-foreground"
              />
            </div>

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
                disabled={form.formState.isSubmitting || (isPremium && !isPaymentDone)}
              >
                {form.formState.isSubmitting ? "Registering..." : "Register"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
