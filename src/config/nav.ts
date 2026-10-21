import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Target,
  Trophy,
  CalendarClock,
  ListChecks,
  BookOpen,
  Sparkles,
  UsersRound,
  FileBarChart,
} from "lucide-react";
import type { PapelUsuario } from "@/types/database";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Se ausente, visível para todos os papéis. */
  papeis?: PapelUsuario[];
}

/**
 * Fonte única da navegação da área logada. Adicionar uma área nova
 * (ex: uma futura unidade ou módulo) começa aqui.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Vendas", href: "/vendas", icon: ShoppingBag },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Ranking", href: "/ranking", icon: Trophy },
  { label: "Agenda", href: "/agenda", icon: CalendarClock },
  { label: "Atividades", href: "/atividades", icon: ListChecks },
  { label: "Relatórios", href: "/relatorios", icon: FileBarChart },
  {
    label: "Equipe",
    href: "/equipe",
    icon: UsersRound,
    papeis: ["gerente", "auxiliar_administrativa"],
  },
  { label: "Base de Conhecimento", href: "/conhecimento", icon: BookOpen },
  { label: "Assistente IA", href: "/assistente", icon: Sparkles },
];
