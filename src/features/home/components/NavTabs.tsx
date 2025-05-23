import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Superteams } from '@/constants/Superteam';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import { regionLiveCountQuery } from '../queries/region-live-count';

interface PillTabProps {
  href: string;
  altActive?: string[];
  children: React.ReactNode;
  phEvent: string;
}

function PillTab({ href, children, altActive, phEvent }: PillTabProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const isActive = router.asPath === href || altActive?.includes(router.asPath);

  return (
    <Link
      href={href}
      className={cn(
        'ph-no-capture flex items-center gap-2 px-3 py-0 sm:py-0.5',
        'rounded-full border border-slate-200 text-sm',
        'hover:bg-violet-50 hover:no-underline',
        isActive ? 'bg-violet-50 text-black' : 'text-slate-500',
      )}
      onClick={() => posthog.capture(phEvent)}
    >
      {children}
    </Link>
  );
}

interface NavTabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NavTabs({ className, ...props }: NavTabsProps) {
  const { user } = useUser();
  const superteam = useMemo(() => {
    return (
      Superteams.find((s) => s.country.includes(user?.location ?? '')) ?? null
    );
  }, [user?.location]);

  const region = superteam?.region;

  const { data: regionLiveCount, refetch } = useQuery(
    regionLiveCountQuery(region!),
  );

  useEffect(() => {
    if (region) {
      refetch();
    }
  }, [region, refetch]);

  const showRegionTab = region && (regionLiveCount?.count ?? 0) > 0;

  const isMd = useBreakpoint('md');
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2',
        className,
      )}
      {...props}
    >
      <PillTab href="/" altActive={['/all/']} phEvent="all_navpill">
        All
      </PillTab>
      {showRegionTab && (
        <PillTab
          href={`/regions/${region.toLowerCase()}/`}
          phEvent={`${region.toLowerCase()}_navpill`}
        >
          {superteam.code && <UserFlag location={superteam.code} isCode />}
          {superteam.displayValue}
        </PillTab>
      )}
      {CATEGORY_NAV_ITEMS?.map((navItem) => {
        return (
          <PillTab
            key={navItem.label}
            altActive={navItem.altActive}
            href={navItem.href}
            phEvent={navItem.pillPH}
          >
            {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
          </PillTab>
        );
      })}
      <Link
        href={'/hackathon/redacted'}
        className={cn(
          'flex items-center py-1 font-medium lg:hidden',
          'h-6',
          'rounded-full border border-slate-200 px-2 text-sm',
        )}
        aria-label="Go to Redacted Hackathon page"
      >
        <ExternalImage
          alt="Redacted Logo"
          src="/hackathon/redacted/logo-black"
          className="h-full object-contain"
        />
      </Link>
      <Link
        href={'/hackathon/breakout'}
        className={cn(
          'flex items-center py-1 font-medium lg:hidden',
          'h-6',
          'rounded-full border border-slate-200 px-2 text-sm',
        )}
        aria-label="Go to Breakout Hackathon page"
      >
        <ExternalImage
          alt="Redacted Logo"
          src="/hackathon/breakout/logo"
          className="h-full object-contain"
        />
      </Link>
    </div>
  );
}
