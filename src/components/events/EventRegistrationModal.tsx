
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventCard } from '@/types/events';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { eventsSeed } from '@/lib/data/events';
import { useRouter } from 'next/navigation';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventCard | null;
  isDark: boolean;
}

export const EventRegistrationModal = ({
  isOpen,
  onClose,
  event,
  isDark,
}: EventRegistrationModalProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setEmail(user.email || '');
      setCompany(user.company || '');
      setJobTitle(user.jobTitle || '');
    }
  }, [user]);

  useEffect(() => {
    // Reset state when modal is closed
    if (!isOpen) {
      setPaymentStatus('idle');
      setIsRegistered(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (event?.participated) {
      setIsRegistered(true);
    }
  }, [event]);

  if (!event) {
    return null;
  }

  const isPremium = event.type === 'Premium';

  const handleRegister = () => {
    if (event.participated) return;

    const eventId = event.id;
    const eventIndex = eventsSeed.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      eventsSeed[eventIndex].participated = true;
    }
    setIsRegistered(true);

    console.log('Registering for event:', event.title);
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Mobile:', mobile);
    console.log('Company:', company);
    console.log('Job Title:', jobTitle);
  };

  const handlePayment = () => {
    setPaymentStatus('success');
  };

  const handleCloseAndRedirect = () => {
    onClose();
    router.push('/events');
  };

  const isPaymentDone = paymentStatus === 'success';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-[525px] ${
          isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-black'
        }`}
      >
        <DialogHeader>
          <DialogTitle>Register for {event.title}</DialogTitle>
          <DialogDescription>
            Please confirm your details for this event.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-left">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Your Name"
              className={`${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isRegistered}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-left">
              Email
            </Label>
            <Input
              id="email"
              placeholder="your.email@example.com"
              className={`${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isRegistered}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobile" className="text-left">
              Mobile
            </Label>
            <Input
              id="mobile"
              placeholder="Your Mobile Number"
              className={`${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={isRegistered}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company" className="text-left">
              Company
            </Label>
            <Input
              id="company"
              placeholder="Your Company"
              className={`${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={isRegistered}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jobTitle" className="text-left">
              Job Title
            </Label>
            <Input
              id="jobTitle"
              placeholder="Your Job Title"
              className={`${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isRegistered}
            />
          </div>

          <div className="col-span-1">
            <div
              className={`mt-4 rounded-md border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              {isPremium ? (
                <div>
                  <p className="text-center font-semibold">
                    This is a premium event.
                  </p>
                  <p className="text-center text-lg font-bold">
                    Price: ${event.price}
                  </p>
                  <div className="mt-4">
                    <Button
                      className={`w-full ${
                        isPaymentDone ? 'bg-green-500 hover:bg-green-600' : ''
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
                  <p className="text-center font-semibold">
                    This is a free event.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          {isRegistered ? (
            <Button type="button" onClick={handleCloseAndRedirect}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleRegister}
                disabled={(isPremium && !isPaymentDone) || isRegistered}
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
