import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyXAF',
  standalone: true
})
export class CurrencyXAFPipe implements PipeTransform {
  transform(value: number | null, currencyCode: string = 'XAF'): string {
    if (value == null) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode
    }).format(value);
  }
}
