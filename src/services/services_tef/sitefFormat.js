export default class SitefFormat {
  formatSitefEntrysToJson(sitefFunctions, sitefEntrys) {
    let mapMsiTef = new Map();

    mapMsiTef.empresaSitef = sitefEntrys.getEmpresaSitef();
    mapMsiTef.enderecoSitef = sitefEntrys.getIp();
    mapMsiTef.operador = '0001';
    mapMsiTef.data = '20200324';
    mapMsiTef.hora = '130358';
    mapMsiTef.numeroCupom = Math.floor(Math.random() * 9999999).toString();
    mapMsiTef.valor = sitefEntrys.getValue().toString();
    mapMsiTef.CNPJ_CPF = '14200166000166';
    mapMsiTef.comExterna = '0';
    mapMsiTef.tipoPinpad = 'ANDROID_USB';

    if (sitefFunctions === 'SALE') {
      mapMsiTef.modalidade = this.paymentToYourCode(
        sitefEntrys.getPaymentMethod(),
      );

      if (sitefEntrys.getPaymentMethod() === 'Crédito') {
        if (
          sitefEntrys.getNumberInstallments() === 1 ||
          sitefEntrys.getNumberInstallments() === 0
        ) {
          mapMsiTef.transacoesHabilitadas = '26';
        } else if (sitefEntrys.getInstallmentsMethods() === 'Loja') {
          mapMsiTef.transacoesHabilitadas = '27';
        } else if (sitefEntrys.getInstallmentsMethods() === 'Adm') {
          mapMsiTef.transacoesHabilitadas = '28';
        }

        mapMsiTef.numParcelas = sitefEntrys.getNumberInstallments().toString();
      }
      if (sitefEntrys.getPaymentMethod() === 'Débito') {
        mapMsiTef.transacoesHabilitadas = '16';
        mapMsiTef.numParcelas = null;
      }
      if (sitefEntrys.getPaymentMethod() === 'Pix') {
        mapMsiTef.cnpj_automacao = '24880034000186';
        mapMsiTef.transacoesHabilitadas = '7;8;';
        mapMsiTef.numParcelas = null;
      }
    }

    if (sitefFunctions === 'CONFIGS') {
      mapMsiTef.modalidade = '110';
      mapMsiTef.isDoubleValidation = '0';
      mapMsiTef.restricoes = 'TransacoesAdicionaisHabilitadas=7;8;3919';
      mapMsiTef.transacoesHabilitadas = null;
      mapMsiTef.caminhoCertificadoCA = 'ca_cert_perm';
    }

    if (sitefFunctions === 'REIMPRESSAO') {
      mapMsiTef.modalidade = '113';
      mapMsiTef.transacoesHabilitadas = '58';
    }

    if (sitefFunctions === 'CANCEL') {
      mapMsiTef.modalidade = '200';
      mapMsiTef.transacoesHabilitadas = null;
      mapMsiTef.isDoubleValidation = '0';
      mapMsiTef.restricoes = 'TransacoesAdicionaisHabilitadas=7;8;3919';
      mapMsiTef.caminhoCertificadoCA = 'ca_cert_perm';
    }

    return mapMsiTef;
  }

  paymentToYourCode(payment) {
    switch (payment) {
      case 'Crédito':
        return '3';
      case 'Débito':
        return '2';
      default:
        return '0';
    }
  }
}
