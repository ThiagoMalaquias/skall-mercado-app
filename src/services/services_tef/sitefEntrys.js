export default class SitefEntrys {
  constructor() {
    this.value = '1000';
    this.numberInstallments = 1;
    this.ip = '192.168.0.15';
    this.paymentMethod = 'Crédito';
    this.installmentsMethod = 'Loja';
    this.empresaSitef = '00000000';
  }

  getValue() {
    return this.value;
  }

  getNumberInstallments() {
    return this.numberInstallments;
  }

  getIp() {
    return this.ip;
  }

  getPaymentMethod() {
    return this.paymentMethod;
  }

  getInstallmentsMethods() {
    return this.installmentsMethod;
  }

  getEmpresaSitef() {
    return this.empresaSitef;
  }

  setValue(value) {
    this.value = value;
  }

  setNumberInstallments(numberInstallments) {
    this.numberInstallments = numberInstallments;
  }

  setIp(ip) {
    this.ip = ip;
  }

  setEmpresaSitef(empresaSitef) {
    this.empresaSitef = empresaSitef;
  }

  setPaymentMethod(paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  setInstallmentsMethods(installmentsMethod) {
    this.installmentsMethod = installmentsMethod;
  }
}
