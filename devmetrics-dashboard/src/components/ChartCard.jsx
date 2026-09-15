import Card, { CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";


export default function ChartCard({ title, subtitle, children, actions, className }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </CardHeader>

      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}