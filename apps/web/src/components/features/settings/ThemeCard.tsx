import { useTheme } from "../../../contexts/ThemeContext";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: "sun" as const },
  { value: "dark" as const, label: "Dark", icon: "moon" as const },
  { value: "system" as const, label: "System", icon: "settings" as const },
];

export function ThemeCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="sun" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Appearance</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2
                  transition-all duration-normal ease-out-expo
                  ${isActive
                    ? "border-accent bg-accent-muted shadow-glow"
                    : "border-default bg-surface-2"
                  }`}
              >
                <Icon name={opt.icon} className={isActive ? "text-accent" : "text-tertiary"} />
                <span className={`text-sm font-medium ${isActive ? "text-accent" : "text-secondary"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
