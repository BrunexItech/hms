import clsx from "clsx";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary",
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  const brand = useBrand();

  if (!brand) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const logo = resolveImageUrl(brand.logoUrl);

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: brand.color, borderRightColor: brand.color }}
        />
        <div
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white"
          style={{ background: brand.color }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={brand.name} className="h-full w-full object-cover" />
          ) : (
            brand.name.charAt(0).toUpperCase()
          )}
        </div>
      </div>
      <p className="text-[13px] font-medium text-muted">{brand.name}</p>
    </div>
  );
}
