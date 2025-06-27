
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
}

interface NameDirectoryProps {
  registeredNames: RegisteredName[];
}

export const NameDirectory = ({ registeredNames }: NameDirectoryProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8 max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-white">Name Directory</CardTitle>
        <CardDescription className="text-purple-200">
          Recently registered .sw names
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {registeredNames.slice(-5).map((name, index) => (
            <div key={`${name.name}-${index}`} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">{name.name}</p>
                <p className="text-purple-300 text-sm font-mono">{name.address.substring(0, 10)}...{name.address.substring(32)}</p>
              </div>
              <Badge variant="outline" className="border-purple-400 text-purple-200">
                Active
              </Badge>
            </div>
          ))}
          {registeredNames.length === 0 && (
            <div className="text-center py-8 text-purple-300">
              No names registered yet. Be the first to claim your .sw identity!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
