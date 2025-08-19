import { Button } from "../shadcn-components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../shadcn-components/ui/dialog"
import { Input } from "../shadcn-components/ui/input"
import { Label } from "../shadcn-components/ui/label"
import { Settings } from "lucide-react" // Import the settings icon

export function EditProfile() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Replace text with the settings icon */}
        <Button variant="outline" className="p-2">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
            {/* Website Versioning */}
<div className="text-xs text-gray-400 mt-2">
  <strong>v1.0.0</strong>
</div>
      </DialogContent>
    </Dialog>
  )
}
