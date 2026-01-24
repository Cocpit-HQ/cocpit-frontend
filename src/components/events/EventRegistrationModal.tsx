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

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventCard | undefined;
  isDark?: boolean; // Optional for compatibility
}

export const EventRegistrationModal = ({
  isOpen,
  onClose,
  event,
}: EventRegistrationModalProps) => {
  const { registerForEvent } = useEvents();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const isPremium = event.price != null && event.price > 0;

  const handlePayment = () => {
    // Mock payment
    setTimeout(() => {
      setIsPaymentDone(true);
    }, 1000);
  };

  const handleRegister = async () => {
    if (event) {
      setError(null);
      const result = await registerForEvent(event.id, {
        name,
        email,
        mobile_number: mobile,
        company_name: company,
        job_title: jobTitle,
      });

      if (result.success) {
        setIsRegistered(true);
      } else {
        const error: any = result.error;
        if (error?.response?.data?.error) {
          setError(error.response.data.error);
        } else if (error?.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError("Failed to register. Please try again.");
        }
      }
    }
  };

  const handleCloseAndRedirect = () => {
    onClose();
    // Redirect logic if needed
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-[425px] max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isRegistered ? 'Registration Successful' : `Register for ${event.title}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm mb-2">
              {error}
            </div>
          )}
          {isRegistered ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                You have successfully registered for <strong>{event.title}</strong>.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                A confirmation email has been sent to {email}.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-left text-foreground">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your Name"
                  className="bg-input border-border text-foreground"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isRegistered}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-left text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="Your Email"
                  className="bg-input border-border text-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isRegistered}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile" className="text-left text-foreground">
                  Mobile
                </Label>
                <Input
                  id="mobile"
                  placeholder="Your Mobile Number"
                  className="bg-input border-border text-foreground"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isRegistered}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company" className="text-left text-foreground">
                  Company
                </Label>
                <Input
                  id="company"
                  placeholder="Your Company"
                  className="bg-input border-border text-foreground"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isRegistered}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle" className="text-left text-foreground">
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="Your Job Title"
                  className="bg-input border-border text-foreground"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isRegistered}
                />
              </div>

              <div className="col-span-1">
                <div
                  className="mt-4 rounded-md border p-4 bg-muted border-border"
                >
                  {isPremium ? (
                    <div>
                      <p className="text-center font-semibold text-foreground">
                        This is a premium event.
                      </p>
                      <p className="text-center text-lg font-bold text-foreground">
                        Price: ${event.price}
                      </p>
                      <div className="mt-4">
                        <Button
                          className={`w-full ${isPaymentDone ? 'bg-green-500 hover:bg-green-600 text-white' : ''
                            }`}
                          onClick={handlePayment}
                          disabled={isPaymentDone || isRegistered}
                        >
                          {isPaymentDone ? 'Payment Done' : 'Proceed to Payment'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-center font-semibold text-foreground">
                        This is a free event.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {isRegistered ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => alert("Mock Ticket Download")}>
                Download Ticket
              </Button>
              <Button type="button" onClick={handleCloseAndRedirect}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleRegister}
                disabled={!name || !email || !mobile || (isPremium && !isPaymentDone) || isRegistered}
              >
                Register
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
