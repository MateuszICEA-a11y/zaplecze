import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-title-md font-medium text-gray-800 dark:text-white/90">404</p>
      <p className="text-gray-500 dark:text-gray-400">Nie ma takiej strony w dashboardzie.</p>
      <Link href="/" className="text-brand-500 hover:text-brand-600">
        Wróć do listy domen
      </Link>
    </div>
  );
}
