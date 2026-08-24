'use client';

import { ChangeEvent } from 'react';
import type { Field } from '@/lib/specs/json-spec.types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type FormFieldProps = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function FormField({ field, value, onChange }: FormFieldProps) {
  const label = field.label ?? field.name;
  const required = field.validation?.required === true;

  switch (field.type) {
    case 'string':
    case 'text':
      if (field.type === 'text') {
        return (
          <div>
            <Label htmlFor={field.name}>
              {label}
              {required && ' *'}
            </Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={String(value ?? '')}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            />
          </div>
        );
      }
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {required && ' *'}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            value={String(value ?? '')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          />
        </div>
      );

    case 'number':
    case 'decimal':
    case 'integer':
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {required && ' *'}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            type="number"
            step={field.type === 'integer' ? '1' : 'any'}
            value={typeof value === 'number' ? value : Number(value) || 0}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={field.name}>
            {label}
            {required && ' *'}
          </Label>
          <Switch id={field.name} checked={!!value} onCheckedChange={onChange} />
        </div>
      );

    case 'enum': {
      const values = (field.validation?.enum ?? []) as string[];
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {required && ' *'}
          </Label>
          <Select value={String(value ?? '')} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`選擇${label}`} />
            </SelectTrigger>
            <SelectContent>
              {values.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    default:
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {required && ' *'}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            value={String(value ?? '')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          />
        </div>
      );
  }
}