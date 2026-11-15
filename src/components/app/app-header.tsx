import { Logo } from "@/components/layout/logo";
import { HeaderTitle } from "@/components/app/header-title";
import { AccountMenu, type AccountMenuUser } from "@/components/app/account-menu";
import { BuyCreditsButton, CreditChip } from "@/components/app/credit-balance";
import type { ApiResult, CreditWallet } from "@/lib/api/types";

export function AppHeader({
  user,
  wallet,
  signInHref,
}: {
  user: AccountMenuUser | null;
  wallet: ApiResult<CreditWallet>;
  signInHref: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:px-8">
      <div className="lg:hidden">
        <Logo href="/dashboard" />
      </div>

      <div className="hidden min-w-0 lg:block">
        <HeaderTitle />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CreditChip wallet={wallet} />
        <BuyCreditsButton className="hidden sm:inline-flex" />
        <AccountMenu user={user} signInHref={signInHref} />
      </div>
    </header>
  );
}
