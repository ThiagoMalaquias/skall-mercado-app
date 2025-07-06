import React, {useState, useEffect} from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';

import {DeviceEventEmitter} from 'react-native';

import PrinterService from '../services/service_printer';
import SitefReturn from '../services/services_tef/sitefReturn';
import SitefController from '../services/services_tef/sitefController';

const printerService = new PrinterService();
const sitefController = new SitefController();
const sitefReturn = new SitefReturn();

export function TefScreen() {
  const [listOfResults, setListOfResults] = useState([]);
  const [valor, setValor] = useState('1000');
  const [numParcelas, setNumParcelas] = useState('1');
  const [numIP, setNumIP] = useState('192.168.1.11');
  const [paymentMethod, setPaymentMethod] = useState('Crédito');
  const [installmentType, setInstallmentType] = useState('Loja');
  const [empresaSitef, setEmpresaSitef] = useState('00000000');

  const buttonsPayment = [
    {
      id: 'Crédito',
      icon: require('../icons/card.png'),
      textButton: 'CRÉDITO',
      onPress: () => {
        setPaymentMethod('Crédito');
        setInstallmentType('Loja');
        setNumParcelas('2');
      },
      invisible: false,
    },
    {
      id: 'Débito',
      icon: require('../icons/card.png'),
      textButton: 'DÉBITO',
      onPress: () => setPaymentMethod('Débito'),
      invisible: false,
    },
    {
      id: 'Pix',
      icon: require('../icons/voucher.png'),
      textButton: 'PIX',
      onPress: () => setPaymentMethod('Pix'),
      invisible: false,
    },
  ];

  const buttonsInstallment = [
    {
      id: 'Loja',
      icon: require('../icons/store.png'),
      textButton: 'LOJA',
      onPress: () => {
        setInstallmentType('Loja');
        setNumParcelas('2');
      },
      invisible: paymentMethod === 'Débito',
    },
    {
      id: 'Adm',
      icon: require('../icons/adm.png'),
      textButton: 'ADM ',
      onPress: () => {
        setInstallmentType('Adm');
        setNumParcelas('2');
      },
      invisible: paymentMethod === 'Débito',
    },
    {
      id: 'Avista',
      icon: require('../icons/card.png'),
      textButton: 'A VISTA',
      onPress: () => {
        setInstallmentType('Avista');
        setNumParcelas('1');
      },
      invisible: paymentMethod === 'Débito',
    },
  ];

  useEffect(() => {
    startConnectPrinterIntern();
  }, []);

  function startConnectPrinterIntern() {
    printerService.sendStartConnectionPrinterIntern();
  }

  function startActionTEF(optionReceived: string) {
    sendSitefParams(optionReceived);
  }

  function sendSitefParams(optionReceived: string) {
    if (isIpAdressValid()) {
      sitefController.sitefEntrys.setValue(valor);
      sitefController.sitefEntrys.setNumberInstallments(
        parseInt(numParcelas, 10),
      );
      sitefController.sitefEntrys.setIp(numIP);
      sitefController.sitefEntrys.setPaymentMethod(paymentMethod);
      sitefController.sitefEntrys.setInstallmentsMethods(installmentType);
      sitefController.sitefEntrys.setEmpresaSitef(empresaSitef);

      try {
        sitefController.sendParamsSitef(optionReceived);

        let resultReceiveTemp = DeviceEventEmitter.addListener(
          'eventResultSitef',
          event => {
            var actualReturn = event.restultMsitef;

            sitefReturn.receiveResultInJSON(actualReturn);
            optionsReturnMsitef(optionReceived);
          },
        );

        setTimeout(() => {
          resultReceiveTemp.remove();
        }, 2000);
      } catch (e) {
        //ERRO
      }
    } else {
      Alert.alert('Alerta', 'Verifique seu endereço IP.');
    }
  }

  function optionsReturnMsitef(sitefFunctions: string) {
    if (
      parseInt(sitefReturn.getcODRESP(), 10) < 0 &&
      sitefReturn.getcODAUTORIZACAO() === ''
    ) {
      Alert.alert('Alerta', 'Ocorreu um erro durante a transação.');
    } else {
      if (
        sitefFunctions === 'SALE' ||
        sitefFunctions === 'CONFIGS' ||
        sitefFunctions === 'REIMPRESSAO'
      ) {
        var textToPrinter = sitefReturn.vIACLIENTE();

        printerService.sendPrinterText(
          textToPrinter,
          'Centralizado',
          false,
          false,
          'FONT B',
          0,
        );
        printerService.jumpLine(10);
        printerService.cutPaper(10);

        updateListOfResults(textToPrinter);
      }

      Alert.alert('Alerta', 'Ação realizada com sucesso.');
    }
  }

  function isIpAdressValid() {
    let ipValid = false;

    if (
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        numIP,
      )
    ) {
      ipValid = true;
      return ipValid;
    } else {
      ipValid = false;
      return ipValid;
    }
  }

  function updateListOfResults(textToPrinter: string) {
    const copyOfListResultsActual = Array.from(listOfResults);

    copyOfListResultsActual.unshift({
      id: Math.floor(Math.random() * 9999999).toString(),
      time: new Date().toLocaleString('pt-BR'),
      text: textToPrinter,
    });

    setListOfResults(copyOfListResultsActual);
  }

  return (
    <View style={styles.mainView}>
      <View style={styles.menuView}>
        <View style={styles.configView}>
          <View style={styles.mensageView}>
            <Text style={styles.labelText}>EMPRESA:</Text>
            <TextInput
              style={styles.inputMensage}
              keyboardType="default"
              onChangeText={setEmpresaSitef}
              value={empresaSitef}
            />
          </View>

          <View style={styles.mensageView}>
            <Text style={styles.labelText}>IP:</Text>
            <TextInput
              style={styles.inputMensage}
              keyboardType="default"
              onChangeText={setNumIP}
              value={numIP}
            />
          </View>

          <View style={styles.mensageView}>
            <Text style={styles.labelText}>VALOR:</Text>
            <TextInput
              placeholder={'000'}
              style={styles.inputMensage}
              keyboardType="numeric"
              onChangeText={setValor}
              value={valor}
            />
          </View>

          <View
            style={[
              styles.mensageView,
              paymentMethod === 'Débito' && styles.optionHidden,
            ]}>
            <Text style={styles.labelText}>Nº PARCELAS:</Text>
            <TextInput
              placeholder={'00'}
              style={styles.inputMensage}
              editable={
                paymentMethod !== 'Débito' && installmentType !== 'Avista'
              }
              keyboardType="numeric"
              onChangeText={setNumParcelas}
              value={numParcelas}
            />
          </View>

          <View style={styles.paymentView}>
            <Text style={styles.labelText}> FORMAS DE PAGAMENTO </Text>
            <View style={styles.paymentsButtonView}>
              {buttonsPayment.map(
                ({id, icon, textButton, onPress, invisible}, index) => (
                  <Pressable
                    style={[
                      styles.paymentButton,
                      id === paymentMethod && styles.optionSelected,
                      invisible && styles.optionHidden,
                    ]}
                    key={index}
                    onPress={onPress}
                    disabled={invisible}>
                    <Image style={styles.icon} source={icon} />
                    <Text style={styles.buttonText}>{textButton}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <View style={styles.paymentView}>
            <Text style={styles.labelText}> TIPO DE PARCELAMENTO </Text>
            <View style={styles.paymentsButtonView}>
              {buttonsInstallment.map(
                ({id, icon, textButton, onPress, invisible}, index) => (
                  <Pressable
                    style={[
                      styles.paymentButton,
                      id === installmentType && styles.optionSelected,
                      invisible && styles.optionHidden,
                    ]}
                    key={index}
                    onPress={onPress}
                    disabled={invisible}>
                    <Image style={styles.icon} source={icon} />
                    <Text style={styles.buttonText}>{textButton}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <View style={styles.submitionButtonsView}>
            <TouchableOpacity
              style={styles.submitionButton}
              onPress={() => startActionTEF('SALE')}>
              <Text style={styles.textButton}>ENVIAR TRANSAÇÃO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitionButton}
              onPress={() => startActionTEF('CANCEL')}>
              <Text style={styles.textButton}>CANCELAR TRANSAÇÃO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.submitionButtonsView}>
            <TouchableOpacity
              style={styles.submitionButton}
              onPress={() => startActionTEF('CONFIGS')}>
              <Text style={styles.textButton}>CONFIGURAÇÃO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitionButton}
              onPress={() => startActionTEF('REIMPRESSAO')}>
              <Text style={styles.textButton}>REIMPRESSÃO</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.returnView}>
          <View style={styles.titleReturnView}>
            <Text style={styles.labelText}>RETORNO</Text>
          </View>

          <FlatList
            data={listOfResults}
            key={index => String(listOfResults)}
            renderItem={({item}, index) => (
              <>
                <Text key={index}>{item.time}:</Text>
                <Text key={index}>{item.text}</Text>
                <Text key={index}>
                  -------------------------------------------
                </Text>
              </>
            )}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  labelText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleText: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
  },
  menuView: {
    flexDirection: 'row',
    width: '90%',
    height: '80%',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  mensageView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    width: '100%',
  },
  inputMensage: {
    flexDirection: 'row',
    width: '70%',
    borderBottomWidth: 0.5,
    borderBottomColor: 'black',
    textAlignVertical: 'bottom',
    padding: 0,
    fontSize: 17,
  },
  configView: {
    flexDirection: 'column',
    width: '47%',
    justifyContent: 'space-between',
  },
  returnView: {
    height: 400,
    padding: 15,
    borderWidth: 3,
    borderRadius: 7,
    borderColor: 'black',
    flexDirection: 'column',
    width: '47%',
    // justifyContent:'space-between'
  },
  paymentView: {
    marginTop: 15,
  },
  paymentsButtonView: {
    flexDirection: 'row',
  },
  paymentButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: 'black',
    width: 60,
    height: 60,
    marginHorizontal: 5,
    opacity: 1,
  },
  typeTEFButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 15,
    borderColor: 'black',
    width: 100,
    height: 35,
    marginHorizontal: 5,
  },
  optionSelected: {
    borderColor: '#23F600',
  },
  optionHidden: {
    opacity: 0,
  },
  icon: {
    width: 30,
    height: 30,
  },
  submitionButtonsView: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitionButton: {
    width: '48%',
    height: 35,
    backgroundColor: '#0069A5',
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
  },
  textButton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  titleReturnView: {
    marginBottom: 10,
  },
  paygoImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
