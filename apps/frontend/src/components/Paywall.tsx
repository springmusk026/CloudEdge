import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NewsletterCTA } from './NewsletterCTA';

interface Props {
  visibility: string;
  isAuthenticated: boolean;
  userTier?: string;
}

export function Paywall({ visibility, isAuthenticated, userTier }: Props) {
  const getMessage = () => {
    if (visibility === 'members' && !isAuthenticated) return { title: 'Members-only content', desc: 'Sign up for free to read this post.' };
    if (visibility === 'paid') return { title: 'Paid subscribers only', desc: 'Upgrade your membership to access this content.' };
    return null;
  };

  const msg = getMessage();
  if (!msg) return null;

  return (
    <Card className="my-10 text-center">
      <CardContent className="py-10 px-6">
        <Lock size={32} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold">{msg.title}</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">{msg.desc}</p>
        {visibility === 'members' ? (
          <div className="mt-6">
            <NewsletterCTA source="paywall" compact />
          </div>
        ) : (
          <Button className="mt-6" size="lg">Upgrade Membership</Button>
        )}
      </CardContent>
    </Card>
  );
}
