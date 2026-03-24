import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash, Pencil, Users } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ProviderGroup } from '@/lib/types';

interface ProviderGroupManagerProps {
  onSelectGroup: (providerNumbers: string[]) => void;
}

export function ProviderGroupManager({ onSelectGroup }: ProviderGroupManagerProps) {
  const [groups, setGroups] = useKV<ProviderGroup[]>('provider-groups', []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProviderGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupProviders, setNewGroupProviders] = useState('');

  const parseProviderNumbers = (input: string): string[] => {
    const parts = input.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length > 0);
    const validProviders = parts.filter(p => /^\d{6}$/.test(p));
    return [...new Set(validProviders)];
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    const providerNumbers = parseProviderNumbers(newGroupProviders);

    if (!name) {
      toast.error('Please enter a group name');
      return;
    }

    if (providerNumbers.length === 0) {
      toast.error('Please enter at least one valid 6-digit provider number');
      return;
    }

    const newGroup: ProviderGroup = {
      id: Date.now().toString(),
      name,
      providerNumbers,
    };

    setGroups((current) => [...(current || []), newGroup]);
    toast.success(`Group "${name}" created with ${providerNumbers.length} provider(s)`);
    
    setNewGroupName('');
    setNewGroupProviders('');
    setIsCreateDialogOpen(false);
  };

  const handleEditGroup = () => {
    if (!editingGroup) return;

    const name = newGroupName.trim();
    const providerNumbers = parseProviderNumbers(newGroupProviders);

    if (!name) {
      toast.error('Please enter a group name');
      return;
    }

    if (providerNumbers.length === 0) {
      toast.error('Please enter at least one valid 6-digit provider number');
      return;
    }

    setGroups((current) =>
      (current || []).map((g) =>
        g.id === editingGroup.id
          ? { ...g, name, providerNumbers }
          : g
      )
    );

    toast.success(`Group "${name}" updated`);
    
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupProviders('');
    setIsEditDialogOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = (groups || []).find((g) => g.id === groupId);
    setGroups((current) => (current || []).filter((g) => g.id !== groupId));
    toast.success(`Group "${group?.name}" deleted`);
  };

  const handleUseGroup = (group: ProviderGroup) => {
    onSelectGroup(group.providerNumbers);
    toast.success(`Using group "${group.name}" with ${group.providerNumbers.length} provider(s)`);
  };

  const openEditDialog = (group: ProviderGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupProviders(group.providerNumbers.join(', '));
    setIsEditDialogOpen(true);
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" weight="bold" />
          <h3 className="text-lg font-semibold">Provider Groups</h3>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" weight="bold" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Provider Group</DialogTitle>
              <DialogDescription>
                Create a named group of provider numbers for quick searching.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Major Hospitals"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-providers">Provider Numbers</Label>
                <Textarea
                  id="group-providers"
                  placeholder="010001, 010002, 010003"
                  value={newGroupProviders}
                  onChange={(e) => setNewGroupProviders(e.target.value)}
                  className="font-mono min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Enter 6-digit provider numbers separated by commas or spaces
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(!groups || groups.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No provider groups yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(groups || []).map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{group.name}</h4>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {group.providerNumbers.length} provider{group.providerNumbers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.providerNumbers.slice(0, 5).map((num) => (
                    <span key={num} className="text-xs font-mono text-muted-foreground">
                      {num}
                    </span>
                  ))}
                  {group.providerNumbers.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{group.providerNumbers.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUseGroup(group)}
                >
                  Use
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(group)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Provider Group</DialogTitle>
            <DialogDescription>
              Update the name or provider numbers for this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                placeholder="e.g., Major Hospitals"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group-providers">Provider Numbers</Label>
              <Textarea
                id="edit-group-providers"
                placeholder="010001, 010002, 010003"
                value={newGroupProviders}
                onChange={(e) => setNewGroupProviders(e.target.value)}
                className="font-mono min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Enter 6-digit provider numbers separated by commas or spaces
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGroup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
