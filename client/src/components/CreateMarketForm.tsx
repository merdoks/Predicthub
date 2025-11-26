import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface CreateMarketFormProps {
  onSubmit: (market: {
    title: string;
    description: string;
    endDate: string;
    options: string[];
  }) => void;
  onCancel: () => void;
}

export default function CreateMarketForm({ onSubmit, onCancel }: CreateMarketFormProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.trim() !== "");
    onSubmit({ title, description, endDate, options: validOptions });
  };

  const canProceed = () => {
    if (step === 1) return title.trim() !== "" && description.trim() !== "";
    if (step === 2) return options.filter(opt => opt.trim() !== "").length >= 2;
    if (step === 3) return endDate !== "";
    return true;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Market</CardTitle>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Market Title</Label>
              <Input
                id="title"
                placeholder="e.g., Will Bitcoin reach $100k by end of 2025?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-market-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide clear criteria for how this market will be resolved..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                data-testid="input-market-description"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Prediction Options (2-4 options)</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  data-testid={`input-option-${index}`}
                />
                {options.length > 2 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(index)}
                    data-testid={`button-remove-option-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <Button
                variant="outline"
                onClick={addOption}
                className="w-full"
                data-testid="button-add-option"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
              <p className="text-sm text-muted-foreground">
                The market will close for predictions on this date
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Your Market</h3>
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <div>
                <div className="text-sm text-muted-foreground">Title</div>
                <div className="font-medium">{title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="text-sm">{description}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">End Date</div>
                <div className="text-sm">{new Date(endDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Options</div>
                <ul className="list-disc list-inside text-sm">
                  {options.filter(opt => opt.trim() !== "").map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-form-back"
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCancel}
            className="ml-auto"
            data-testid="button-form-cancel"
          >
            Cancel
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              data-testid="button-form-next"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              data-testid="button-form-submit"
            >
              Create Market
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
