import moment from 'moment';

export const FormatToBRL = (value: any) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const FormatCentToBRL = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',');
};

export const FormatCNPJ = (value: any) => {
  if (!value) return '';

  const cnpj = value.toString().replace(/\D/g, '');

  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
};

export const FormatCPF = (value: any) => {
  if (!value) return '';

  const cpf = value.toString().replace(/\D/g, '');

  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

export const FormatToBrazilianDateTime = (isoString: any) => {
  return moment(isoString).format('DD/MM/YYYY HH:mm');
};

export const FormatDate = (date: any) => moment(date).format('DD/MM/YYYY');
