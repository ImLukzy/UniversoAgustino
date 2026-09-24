import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { useAuthModal } from "../AuthModalHost";

const pill = "btn btn-secondary btn-sm hidden md:inline-flex";

// Header Studocu: logo + enlaces de texto a la izquierda; píldoras blancas y login verde a la derecha.
export function LandingNav() {
  const { openAuth } = useAuthModal();
  return (
    <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-8">
        <Link to={ROUTES.home} className="flex items-center gap-2 text-white">
          <img src="/logo-ua.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="whitespace-nowrap font-display text-lg font-extrabold tracking-tight">Universo Agustino</span>
        </Link>
        <a href="#carreras" className="hidden text-[15px] font-bold text-white hover:underline lg:inline">Facultades</a>
        <Link to={ROUTES.bazar} className="hidden text-[15px] font-bold text-white hover:underline lg:inline">Bazar</Link>
      </div>
      <div className="flex items-center gap-2">
        <Link to={ROUTES.explore} className={pill}>Explorar apuntes</Link>
        <Link to={ROUTES.monetiza} className={pill}>Vende tus apuntes</Link>
        <button
          type="button"
          onClick={openAuth}
          className="btn btn-sm bg-[#00d836] text-black"
        >
          Iniciar sesión
        </button>
      </div>
    </nav>
  );
}
