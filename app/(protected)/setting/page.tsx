export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Settings Content</p>
      </div>
    </div>
  );
}
